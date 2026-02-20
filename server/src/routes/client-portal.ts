import { Router, Response, Request } from 'express';
import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

const router = Router();

// Client portal - access by token (no auth needed)
router.get('/suivi/:token', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  
  const intervention: any = await db.prepare(`
    SELECT i.*, 
           c.first_name as client_first_name, c.last_name as client_last_name, c.company_name,
           c.email as client_email, c.phone as client_phone, c.language as client_language,
           t.first_name as tech_first_name, t.last_name as tech_last_name, t.phone as tech_phone, t.photo_url as tech_photo,
           tp.current_latitude as tech_lat, tp.current_longitude as tech_lng
    FROM interventions i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN users t ON i.technician_id = t.id
    LEFT JOIN technician_profiles tp ON t.id = tp.user_id
    WHERE i.client_token = ?
  `).get(req.params.token);

  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide ou expiré' });
    return;
  }

  // Check token expiration
  if (intervention.client_token_expires && new Date(intervention.client_token_expires) < new Date()) {
    res.status(410).json({ error: 'Ce lien a expiré' });
    return;
  }

  // Don't expose sensitive data
  const safeData = {
    reference: intervention.reference,
    type: intervention.type,
    description: intervention.description,
    status: intervention.status,
    address: intervention.address,
    city: intervention.city,
    country: intervention.country,
    priority: intervention.priority,
    scheduled_date: intervention.scheduled_date,
    scheduled_start_time: intervention.scheduled_start_time,
    scheduled_end_time: intervention.scheduled_end_time,
    technician: intervention.tech_first_name ? {
      first_name: intervention.tech_first_name,
      last_name: intervention.tech_last_name,
      phone: intervention.tech_phone,
      photo_url: intervention.tech_photo,
      current_latitude: intervention.status === 'en_cours' ? intervention.tech_lat : null,
      current_longitude: intervention.status === 'en_cours' ? intervention.tech_lng : null,
    } : null,
    client_rating: intervention.client_rating,
    client_comment: intervention.client_comment,
    language: intervention.client_language || 'fr',
  };

  res.json(safeData);
});

// Client confirms date
router.post('/suivi/:token/confirm', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  
  const intervention: any = await db.prepare(`SELECT id, status FROM interventions WHERE client_token = ?`).get(req.params.token);
  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide' });
    return;
  }

  await db.prepare(`UPDATE interventions SET status = 'confirmee', updated_at = datetime('now') WHERE id = ?`).run(intervention.id);
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, old_value, new_value, performed_by, performed_by_role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuid(), intervention.id, 'confirmation_client', intervention.status, 'confirmee', 'client', 'client'
  );

  res.json({ success: true, status: 'confirmee' });
});

// Client reschedule
router.post('/suivi/:token/reschedule', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const { preferred_date, preferred_time, comment } = req.body;
  
  const intervention: any = await db.prepare(`SELECT id, reference FROM interventions WHERE client_token = ?`).get(req.params.token);
  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide' });
    return;
  }

  await db.prepare(`UPDATE interventions SET status = 'reportee', updated_at = datetime('now') WHERE id = ?`).run(intervention.id);
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuid(), intervention.id, 'replanification_client', 'reportee', 'client', 'client',
    `Date souhaitée: ${preferred_date} ${preferred_time || ''}. ${comment || ''}`
  );

  // Notify supervisors
  const intFull: any = await db.prepare(`SELECT country FROM interventions WHERE id = ?`).get(intervention.id);
  const supervisors: any[] = await db.prepare(`SELECT id FROM users WHERE role IN ('superviseur', 'admin_pays') AND country = ?`).all(intFull?.country);
  
  for (const sup of supervisors) {
    await db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuid(), sup.id, 'client_reschedule',
      'Demande de replanification client',
      `Le client demande une replanification pour ${intervention.reference}`,
      JSON.stringify({ intervention_id: intervention.id, preferred_date, preferred_time })
    );
  }

  res.json({ success: true, status: 'reportee' });
});

// Client cancel
router.post('/suivi/:token/cancel', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const { reason } = req.body;
  
  const intervention: any = await db.prepare(`SELECT id FROM interventions WHERE client_token = ?`).get(req.params.token);
  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide' });
    return;
  }

  await db.prepare(`UPDATE interventions SET status = 'annulee', updated_at = datetime('now') WHERE id = ?`).run(intervention.id);
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, new_value, performed_by, performed_by_role, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuid(), intervention.id, 'annulation_client', 'annulee', 'client', 'client', reason || ''
  );

  res.json({ success: true, status: 'annulee' });
});

// Client add comment
router.post('/suivi/:token/comment', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const { comment } = req.body;
  
  const intervention: any = await db.prepare(`SELECT id FROM interventions WHERE client_token = ?`).get(req.params.token);
  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide' });
    return;
  }

  await db.prepare(`UPDATE interventions SET client_comment = ?, updated_at = datetime('now') WHERE id = ?`).run(comment, intervention.id);
  await db.prepare(`INSERT INTO intervention_history (id, intervention_id, action, performed_by, performed_by_role, notes)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    uuid(), intervention.id, 'commentaire_client', 'client', 'client', comment
  );

  res.json({ success: true });
});

// Client rate
router.post('/suivi/:token/rate', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const { rating, comment } = req.body;
  
  const intervention: any = await db.prepare(`SELECT id FROM interventions WHERE client_token = ?`).get(req.params.token);
  if (!intervention) {
    res.status(404).json({ error: 'Lien invalide' });
    return;
  }

  await db.prepare(`UPDATE interventions SET client_rating = ?, client_comment = ?, updated_at = datetime('now') WHERE id = ?`).run(
    rating, comment || null, intervention.id
  );

  res.json({ success: true });
});

// Get available slots for rescheduling
router.get('/suivi/:token/available-slots', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  
  const intervention: any = await db.prepare(`
    SELECT i.*, tp.work_start_time, tp.work_end_time, tp.working_days, tp.max_daily_interventions
    FROM interventions i
    LEFT JOIN technician_profiles tp ON i.technician_id = tp.user_id
    WHERE i.client_token = ?
  `).get(req.params.token);

  if (!intervention || !intervention.technician_id) {
    res.status(404).json({ error: 'Pas de créneaux disponibles' });
    return;
  }

  const slots: { date: string; start: string; end: string }[] = [];
  const workingDays = JSON.parse(intervention.working_days || '[1,2,3,4,5]');

  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    if (!workingDays.includes(dayOfWeek)) continue;

    const dateStr = d.toISOString().split('T')[0];
    const existingCount: any = await db.prepare(`
      SELECT COUNT(*) as c FROM interventions 
      WHERE technician_id = ? AND scheduled_date = ? AND status NOT IN ('annulee','finalisee')
    `).get(intervention.technician_id, dateStr);

    if ((existingCount?.c || 0) < (intervention.max_daily_interventions || 6)) {
      slots.push({ date: dateStr, start: '09:00', end: '11:00' });
      slots.push({ date: dateStr, start: '11:00', end: '13:00' });
      slots.push({ date: dateStr, start: '14:00', end: '16:00' });
      slots.push({ date: dateStr, start: '16:00', end: '18:00' });
    }
  }

  res.json(slots);
});

export default router;
