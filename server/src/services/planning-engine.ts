import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

interface TechnicianCandidate {
  user_id: string;
  first_name: string;
  last_name: string;
  country: string;
  region: string;
  city: string;
  certifications: string[];
  skills: string[];
  latitude: number;
  longitude: number;
  current_latitude: number;
  current_longitude: number;
  max_daily_interventions: number;
  is_available: number;
  work_start_time: string;
  work_end_time: string;
  working_days: number[];
  zone_radius_km: number;
  score: number;
  distance_km: number;
  current_load: number;
}

interface PlanningResult {
  success: boolean;
  technician_id?: string;
  technician_name?: string;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  planning_score?: number;
  reason?: string;
}

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate travel time in minutes (avg 50km/h in urban/suburban areas)
function estimateTravelTime(distanceKm: number): number {
  return Math.ceil(distanceKm / 50 * 60);
}

// Get intervention duration estimate in minutes by type
function getInterventionDuration(type: string): number {
  const durations: Record<string, number> = {
    'installation_fibre': 120,
    'depannage': 90,
    'maintenance': 60,
    'raccordement': 90,
    'soudure': 120,
    'tirage_cable': 180,
    'audit_technique': 60,
    'mise_en_service': 90,
  };
  return durations[type] || 90;
}

// Get required skills for intervention type
function getRequiredSkills(type: string): string[] {
  const skillMap: Record<string, string[]> = {
    'installation_fibre': ['fibre_optique'],
    'depannage': ['fibre_optique'],
    'maintenance': ['fibre_optique'],
    'raccordement': ['fibre_optique', 'FTTH'],
    'soudure': ['fibre_optique', 'soudure'],
    'tirage_cable': ['fibre_optique'],
    'audit_technique': ['fibre_optique'],
    'mise_en_service': ['fibre_optique', 'FTTH'],
  };
  return skillMap[type] || ['fibre_optique'];
}

// Priority weight multiplier
function getPriorityWeight(priority: string): number {
  const weights: Record<string, number> = {
    'critique': 4,
    'haute': 3,
    'normale': 2,
    'basse': 1,
  };
  return weights[priority] || 2;
}

export class PlanningEngine {
  
  // Main auto-planning function
  async autoAssign(interventionId: string): Promise<PlanningResult> {
    const db = getDb();
    
    const intervention: any = await db.prepare(`
      SELECT * FROM interventions WHERE id = ?
    `).get(interventionId);

    if (!intervention) {
      return { success: false, reason: 'Intervention introuvable' };
    }

    if (intervention.status !== 'en_attente') {
      return { success: false, reason: `Intervention déjà en statut: ${intervention.status}` };
    }

    // Get eligible technicians
    const candidates = await this.findEligibleTechnicians(intervention);
    
    if (candidates.length === 0) {
      return { success: false, reason: 'Aucun technicien disponible trouvé' };
    }

    // Score and rank candidates
    const scoredCandidates = this.scoreCandidates(candidates, intervention);
    
    // Find optimal time slot for best candidate
    const bestCandidate = scoredCandidates[0];
    const slot = await this.findOptimalSlot(bestCandidate, intervention);

    if (!slot) {
      // Try next candidates
      for (let i = 1; i < scoredCandidates.length; i++) {
        const altSlot = await this.findOptimalSlot(scoredCandidates[i], intervention);
        if (altSlot) {
          return this.assignIntervention(intervention, scoredCandidates[i], altSlot);
        }
      }
      return { success: false, reason: 'Aucun créneau disponible trouvé pour les techniciens éligibles' };
    }

    return this.assignIntervention(intervention, bestCandidate, slot);
  }

  // Find all technicians eligible for this intervention
  private async findEligibleTechnicians(intervention: any): Promise<TechnicianCandidate[]> {
    const db = getDb();
    
    const technicians: any[] = await db.prepare(`
      SELECT u.id as user_id, u.first_name, u.last_name, u.country, u.region, u.city,
             tp.certifications, tp.skills, tp.max_daily_interventions,
             tp.latitude, tp.longitude, tp.current_latitude, tp.current_longitude,
             tp.is_available, tp.work_start_time, tp.work_end_time,
             tp.working_days, tp.zone_radius_km
      FROM users u
      JOIN technician_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'technicien' 
        AND u.is_active = 1 
        AND tp.is_available = 1
        AND u.country = ?
    `).all(intervention.country);

    const today = new Date().toISOString().split('T')[0];
    const loads: any[] = await db.prepare(`
      SELECT technician_id, COUNT(*) as count
      FROM interventions
      WHERE scheduled_date = ?
        AND status NOT IN ('annulee', 'finalisee')
      GROUP BY technician_id
    `).all(today);
    const loadByTech = new Map<string, number>();
    for (const l of loads) {
      loadByTech.set(l.technician_id, Number(l.count) || 0);
    }

    const requiredSkills = getRequiredSkills(intervention.type);
    
    const candidates: TechnicianCandidate[] = [];
    for (const t of technicians) {
      const certs = JSON.parse(t.certifications || '[]');
      const skills = JSON.parse(t.skills || '[]');
      const workingDays = JSON.parse(t.working_days || '[1,2,3,4,5]');

      // Check if technician has required certifications
      const hasRequiredCerts = requiredSkills.every(
        skill => certs.includes(skill) || skills.includes(skill)
      );
      if (!hasRequiredCerts) continue;

      // Calculate distance
      const distance = haversineDistance(
        t.current_latitude || t.latitude,
        t.current_longitude || t.longitude,
        intervention.latitude || 0,
        intervention.longitude || 0
      );

      // Check zone radius
      if (distance > t.zone_radius_km) continue;

      // Daily load
      const currentLoad = loadByTech.get(t.user_id) || 0;
      if (currentLoad >= t.max_daily_interventions) continue;

      candidates.push({
        ...t,
        certifications: certs,
        skills,
        working_days: workingDays,
        distance_km: distance,
        current_load: currentLoad,
        score: 0,
      } as TechnicianCandidate);
    }

    return candidates;
  }

  // Score candidates based on multiple criteria
  private scoreCandidates(candidates: TechnicianCandidate[], intervention: any): TechnicianCandidate[] {
    const priorityWeight = getPriorityWeight(intervention.priority);
    
    const maxDistance = Math.max(...candidates.map(c => c.distance_km), 1);
    const maxLoad = Math.max(...candidates.map(c => c.current_load), 1);

    return candidates.map(c => {
      // Distance score (closer = better) - 40% weight
      const distanceScore = (1 - c.distance_km / maxDistance) * 40;
      
      // Load balance score (less busy = better) - 25% weight
      const loadScore = (1 - c.current_load / c.max_daily_interventions) * 25;
      
      // Skill match score (more matching skills = better) - 20% weight
      const requiredSkills = getRequiredSkills(intervention.type);
      const matchedSkills = requiredSkills.filter(s => 
        c.certifications.includes(s) || c.skills.includes(s)
      );
      const skillScore = (matchedSkills.length / requiredSkills.length) * 20;
      
      // Priority urgency bonus - 15% weight
      const urgencyScore = priorityWeight * 3.75;

      c.score = distanceScore + loadScore + skillScore + urgencyScore;
      return c;
    }).sort((a, b) => b.score - a.score);
  }

  // Find optimal time slot for a technician
  private async findOptimalSlot(technician: TechnicianCandidate, intervention: any): Promise<{ date: string; start: string; end: string } | null> {
    const db = getDb();
    const duration = getInterventionDuration(intervention.type);
    const travelTime = estimateTravelTime(technician.distance_km);
    const totalNeeded = duration + travelTime;

    // Try scheduling within deadline, starting from today
    const deadline = intervention.deadline ? new Date(intervention.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const startDate = new Date();
    
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      if (checkDate > deadline) break;

      const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay();
      if (!technician.working_days.includes(dayOfWeek)) continue;

      const dateStr = checkDate.toISOString().split('T')[0];

      // Check daily load
      const dayLoad: any = await db.prepare(`
        SELECT COUNT(*) as count FROM interventions 
        WHERE technician_id = ? AND scheduled_date = ?
        AND status NOT IN ('annulee', 'finalisee')
      `).get(technician.user_id, dateStr);
      
      if ((dayLoad?.count || 0) >= technician.max_daily_interventions) continue;

      // Get existing slots for this day
      const existingSlots: any[] = await db.prepare(`
        SELECT scheduled_start_time, scheduled_end_time FROM interventions
        WHERE technician_id = ? AND scheduled_date = ?
        AND status NOT IN ('annulee', 'finalisee')
        ORDER BY scheduled_start_time
      `).all(technician.user_id, dateStr);

      // Find free window
      const slot = this.findFreeWindow(
        technician.work_start_time,
        technician.work_end_time,
        existingSlots,
        totalNeeded
      );

      if (slot) {
        return { date: dateStr, start: slot.start, end: slot.end };
      }
    }

    return null;
  }

  // Find a free time window in the day
  private findFreeWindow(
    workStart: string, 
    workEnd: string, 
    existingSlots: { scheduled_start_time: string; scheduled_end_time: string }[],
    neededMinutes: number
  ): { start: string; end: string } | null {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMinutes = (m: number) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    const dayStart = toMinutes(workStart);
    const dayEnd = toMinutes(workEnd);
    
    // Build occupied intervals
    const occupied = existingSlots
      .filter(s => s.scheduled_start_time && s.scheduled_end_time)
      .map(s => ({
        start: toMinutes(s.scheduled_start_time),
        end: toMinutes(s.scheduled_end_time) + 15, // 15 min buffer between interventions
      }))
      .sort((a, b) => a.start - b.start);

    // Find gaps
    let searchStart = dayStart;
    
    for (const slot of occupied) {
      if (slot.start - searchStart >= neededMinutes) {
        return {
          start: fromMinutes(searchStart),
          end: fromMinutes(searchStart + neededMinutes),
        };
      }
      searchStart = Math.max(searchStart, slot.end);
    }

    // Check after last slot
    if (dayEnd - searchStart >= neededMinutes) {
      return {
        start: fromMinutes(searchStart),
        end: fromMinutes(searchStart + neededMinutes),
      };
    }

    return null;
  }

  // Assign intervention to technician
  private async assignIntervention(
    intervention: any,
    technician: TechnicianCandidate,
    slot: { date: string; start: string; end: string }
  ): Promise<PlanningResult> {
    const db = getDb();

    const clientToken = uuid();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(`
      UPDATE interventions SET
        technician_id = ?,
        status = 'planifiee_auto',
        scheduled_date = ?,
        scheduled_start_time = ?,
        scheduled_end_time = ?,
        planning_mode = 'auto',
        planning_score = ?,
        client_token = ?,
        client_token_expires = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      technician.user_id,
      slot.date,
      slot.start,
      slot.end,
      technician.score,
      clientToken,
      tokenExpires,
      intervention.id
    );

    // Add schedule entry
    await db.prepare(`INSERT INTO technician_schedule (id, technician_id, date, start_time, end_time, intervention_id)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuid(), technician.user_id, slot.date, slot.start, slot.end, intervention.id
    );

    // Log history
    await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, old_value, new_value, performed_by, performed_by_role, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuid(), intervention.id, 'planification_auto', 'en_attente', 'planifiee_auto',
      'system', 'system',
      `Technicien: ${technician.first_name} ${technician.last_name}, Score: ${technician.score.toFixed(1)}, Distance: ${technician.distance_km.toFixed(1)}km`
    );

    // Create notification for technician
    await db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuid(), technician.user_id, 'new_assignment',
      'Nouvelle intervention assignée',
      `Intervention ${intervention.reference} planifiée le ${slot.date} de ${slot.start} à ${slot.end}`,
      JSON.stringify({ intervention_id: intervention.id, date: slot.date, start: slot.start, end: slot.end })
    );

    return {
      success: true,
      technician_id: technician.user_id,
      technician_name: `${technician.first_name} ${technician.last_name}`,
      scheduled_date: slot.date,
      scheduled_start_time: slot.start,
      scheduled_end_time: slot.end,
      planning_score: technician.score,
    };
  }

  // Replan intervention
  async replan(interventionId: string): Promise<PlanningResult> {
    const db = getDb();
    
    // Reset intervention status
    await db.prepare(`
      UPDATE interventions SET 
        status = 'en_attente',
        technician_id = NULL,
        scheduled_date = NULL,
        scheduled_start_time = NULL,
        scheduled_end_time = NULL,
        planning_mode = 'auto',
        planning_score = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(interventionId);

    // Remove schedule entries
    await db.prepare(`DELETE FROM technician_schedule WHERE intervention_id = ?`).run(interventionId);

    // Log replan
    await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuid(), interventionId, 'replanification', 'en_attente', 'system', 'system'
    );

    // Re-run auto assignment
    return this.autoAssign(interventionId);
  }

  // Manual override
  manualAssign(
    interventionId: string,
    technicianId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason: string,
    overrideBy: string
  ): Promise<PlanningResult> {
    // keep signature for callers; implementation is async
    return this.manualAssignImpl(interventionId, technicianId, date, startTime, endTime, reason, overrideBy);
  }

  private async manualAssignImpl(
    interventionId: string,
    technicianId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason: string,
    overrideBy: string
  ): Promise<PlanningResult> {
    const db = getDb();

    const tech: any = await db.prepare(`
      SELECT u.first_name, u.last_name FROM users u WHERE u.id = ?
    `).get(technicianId);

    if (!tech) {
      return { success: false, reason: 'Technicien introuvable' };
    }

    const clientToken = uuid();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(`
      UPDATE interventions SET
        technician_id = ?,
        status = 'planifiee_auto',
        scheduled_date = ?,
        scheduled_start_time = ?,
        scheduled_end_time = ?,
        planning_mode = 'manual',
        manual_override_reason = ?,
        manual_override_by = ?,
        client_token = COALESCE(client_token, ?),
        client_token_expires = COALESCE(client_token_expires, ?),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      technicianId, date, startTime, endTime, reason, overrideBy,
      clientToken, tokenExpires, interventionId
    );

    // Schedule entry
    await db.prepare(`DELETE FROM technician_schedule WHERE intervention_id = ?`).run(interventionId);
    await db.prepare(`INSERT INTO technician_schedule (id, technician_id, date, start_time, end_time, intervention_id)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuid(), technicianId, date, startTime, endTime, interventionId
    );

    // History - mark as manual override
    await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role, notes, is_manual_override)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`).run(
      uuid(), interventionId, 'attribution_manuelle', 'planifiee_auto',
      overrideBy, 'admin',
      `Attribution manuelle: ${tech.first_name} ${tech.last_name}. Raison: ${reason}`
    );

    return {
      success: true,
      technician_id: technicianId,
      technician_name: `${tech.first_name} ${tech.last_name}`,
      scheduled_date: date,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
    };
  }

  // Check SLA violations
  async checkSLAViolations(): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();

    // Find interventions past their deadline that aren't completed
    const overdue: any[] = await db.prepare(`
      SELECT id, reference, deadline, sla_hours, country, technician_id
      FROM interventions
      WHERE deadline < ?
      AND status NOT IN ('finalisee', 'annulee', 'en_retard')
    `).all(now);

    for (const int of overdue) {
      // Update status to en_retard
      await db.prepare(`UPDATE interventions SET status = 'en_retard', updated_at = datetime('now') WHERE id = ?`).run(int.id);

      // Create SLA violation record
      await db.prepare(`INSERT INTO sla_violations (id, intervention_id, violation_type, expected_time, actual_time, country)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        uuid(), int.id, 'deadline_depassee', int.deadline, now, int.country
      );

      // Log in history
      await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        uuid(), int.id, 'sla_violation', 'en_retard', 'system', 'system',
        `Dépassement SLA détecté. Deadline: ${int.deadline}`
      );

      // Notify supervisor
      if (int.technician_id) {
        const techInfo: any = await db.prepare(`SELECT country, region FROM users WHERE id = ?`).get(int.technician_id);
        const supervisors: any[] = await db.prepare(`
          SELECT id FROM users WHERE role = 'superviseur' AND country = ?
        `).all(techInfo?.country || int.country);

        for (const sup of supervisors) {
          await db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, data)
            VALUES (?, ?, ?, ?, ?, ?)`).run(
            uuid(), sup.id, 'sla_violation',
            'Violation SLA détectée',
            `L'intervention ${int.reference} a dépassé son délai SLA`,
            JSON.stringify({ intervention_id: int.id })
          );
        }
      }
    }

    return overdue.length;
  }
}

export const planningEngine = new PlanningEngine();
