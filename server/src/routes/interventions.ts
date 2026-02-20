import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { planningEngine } from '../services/planning-engine';

const router = Router();

// List interventions with filters
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { status, country, city, priority, type, technician_id, date_from, date_to, search } = req.query;

  let query = `
    SELECT i.*, 
           c.first_name as client_first_name, c.last_name as client_last_name, c.company_name, c.email as client_email, c.phone as client_phone,
           t.first_name as tech_first_name, t.last_name as tech_last_name, t.email as tech_email
    FROM interventions i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN users t ON i.technician_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Role-based filtering
  if (req.user!.role === 'admin_pays' || req.user!.role === 'superviseur') {
    query += ' AND i.country = ?';
    params.push(req.user!.country);
  }
  if (req.user!.role === 'technicien') {
    query += ' AND i.technician_id = ?';
    params.push(req.user!.id);
  }

  if (status) { query += ' AND i.status = ?'; params.push(status); }
  if (country) { query += ' AND i.country = ?'; params.push(country); }
  if (city) { query += ' AND i.city LIKE ?'; params.push(`%${city}%`); }
  if (priority) { query += ' AND i.priority = ?'; params.push(priority); }
  if (type) { query += ' AND i.type = ?'; params.push(type); }
  if (technician_id) { query += ' AND i.technician_id = ?'; params.push(technician_id); }
  if (date_from) { query += ' AND i.scheduled_date >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND i.scheduled_date <= ?'; params.push(date_to); }
  if (search) {
    query += ' AND (i.reference LIKE ? OR i.description LIKE ? OR i.city LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY i.created_at DESC';

  const interventions = await db.prepare(query).all(...params);
  res.json(interventions);
});

// Get single intervention
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const intervention: any = await db.prepare(`
    SELECT i.*, 
           c.first_name as client_first_name, c.last_name as client_last_name, c.company_name, 
           c.email as client_email, c.phone as client_phone, c.type as client_type,
           t.first_name as tech_first_name, t.last_name as tech_last_name, t.email as tech_email, t.phone as tech_phone
    FROM interventions i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN users t ON i.technician_id = t.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!intervention) {
    res.status(404).json({ error: 'Intervention non trouvée' });
    return;
  }

  if ((req.user!.role === 'admin_pays' || req.user!.role === 'superviseur') && intervention.country !== req.user!.country) {
    res.status(403).json({ error: 'Accès non autorisé' });
    return;
  }

  // Get history
  const history = await db.prepare(`
    SELECT * FROM intervention_history WHERE intervention_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...intervention, history });
});

// Create intervention (with auto-planning)
router.post('/', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const {
    type, description, client_id, address, city, postal_code, country,
    latitude, longitude, priority, sla_hours, deadline
  } = req.body;

  // Generate reference
  const countRef = await db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ?`).get(country) as any;
  const ref = `INT-${country}-${String((countRef?.c || 0) + 1).padStart(5, '0')}`;

  const id = uuid();
  const token = uuid();
  const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const deadlineDate = deadline || new Date(Date.now() + (sla_hours || 48) * 60 * 60 * 1000).toISOString();

  await db.prepare(`INSERT INTO interventions (id, reference, type, description, client_id,
    address, city, postal_code, country, latitude, longitude,
    priority, status, sla_hours, deadline, client_token, client_token_expires, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, ?, ?, ?, ?)`).run(
    id, ref, type, description || '', client_id || null,
    address, city, postal_code, country,
    latitude || null, longitude || null,
    priority || 'normale', sla_hours || 48, deadlineDate,
    token, tokenExpires, req.user!.id
  );

  // Log creation
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    uuid(), id, 'creation', 'en_attente', req.user!.id, req.user!.role
  );

  // Auto-plan immediately
  const planResult = await planningEngine.autoAssign(id);

  const intervention = await db.prepare('SELECT * FROM interventions WHERE id = ?').get(id);

  res.status(201).json({
    intervention,
    planning: planResult,
    client_link: `/intervention/suivi/${token}`,
  });
});

// Update intervention
router.put('/:id', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { description, priority, sla_hours, deadline, address, city, postal_code, latitude, longitude } = req.body;

  const current: any = await db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  if (!current) {
    res.status(404).json({ error: 'Intervention non trouvée' });
    return;
  }

  await db.prepare(`UPDATE interventions SET description = ?, priority = ?, sla_hours = ?, deadline = ?,
    address = ?, city = ?, postal_code = ?, latitude = ?, longitude = ?, updated_at = datetime('now')
    WHERE id = ?`).run(
    description ?? current.description, priority ?? current.priority,
    sla_hours ?? current.sla_hours, deadline ?? current.deadline,
    address ?? current.address, city ?? current.city, postal_code ?? current.postal_code,
    latitude ?? current.latitude, longitude ?? current.longitude,
    req.params.id
  );

  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, performed_by, performed_by_role, notes)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    uuid(), req.params.id, 'modification', req.user!.id, req.user!.role,
    `Modification par ${req.user!.email}`
  );

  res.json({ success: true });
});

// Cancel intervention
router.post('/:id/cancel', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { reason } = req.body;

  await db.prepare(`UPDATE interventions SET status = 'annulee', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  await db.prepare(`DELETE FROM technician_schedule WHERE intervention_id = ?`).run(req.params.id);
  
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuid(), req.params.id, 'annulation', 'annulee', req.user!.id, req.user!.role, reason || 'Annulée'
  );

  res.json({ success: true });
});

// Replan intervention (auto)
router.post('/:id/replan', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await planningEngine.replan(req.params.id);
  res.json(result);
});

// Manual assign
router.post('/:id/manual-assign', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { technician_id, date, start_time, end_time, reason } = req.body;
  
  const result = await planningEngine.manualAssign(
    req.params.id, technician_id, date, start_time, end_time,
    reason || 'Attribution manuelle', req.user!.id
  );

  res.json(result);
});

// Technician actions
router.post('/:id/start', authMiddleware, requireRole('technicien'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  await db.prepare(`UPDATE interventions SET status = 'en_cours', actual_start_time = datetime('now'), updated_at = datetime('now') WHERE id = ? AND technician_id = ?`).run(
    req.params.id, req.user!.id
  );
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role)
    VALUES (?, ?, ?, ?, ?, ?)`).run(uuid(), req.params.id, 'demarrage', 'en_cours', req.user!.id, 'technicien');
  res.json({ success: true });
});

router.post('/:id/complete', authMiddleware, requireRole('technicien'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { report, photos } = req.body;

  await db.prepare(`UPDATE interventions SET status = 'finalisee', actual_end_time = datetime('now'),
    report = ?, photos = ?, updated_at = datetime('now') WHERE id = ? AND technician_id = ?`).run(
    report || '', JSON.stringify(photos || []), req.params.id, req.user!.id
  );
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role)
    VALUES (?, ?, ?, ?, ?, ?)`).run(uuid(), req.params.id, 'finalisation', 'finalisee', req.user!.id, 'technicien');
  res.json({ success: true });
});

// Delay justification
router.post('/:id/justify-delay', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { delay_reason, delay_category } = req.body;

  await db.prepare(`UPDATE interventions SET delay_reason = ?, delay_category = ?, updated_at = datetime('now') WHERE id = ?`).run(
    delay_reason, delay_category, req.params.id
  );

  await db.prepare(`UPDATE sla_violations SET justification = ?, justified_by = ? WHERE intervention_id = ?`).run(
    delay_reason, req.user!.id, req.params.id
  );

  res.json({ success: true });
});

// Update GPS position (technician)
router.post('/update-gps', authMiddleware, requireRole('technicien'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { latitude, longitude } = req.body;
  
  await db.prepare(`UPDATE technician_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?`).run(
    latitude, longitude, req.user!.id
  );

  res.json({ success: true });
});

export default router;
