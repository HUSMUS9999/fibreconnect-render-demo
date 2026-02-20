import { Router, Response } from 'express';
import { getDb } from '../database';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Global dashboard stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { country, date_from, date_to } = req.query;

  let countryFilter = '';
  const params: any[] = [];
  
  if (req.user!.role === 'admin_pays' || req.user!.role === 'superviseur') {
    countryFilter = ' AND country = ?';
    params.push(req.user!.country);
  } else if (country) {
    countryFilter = ' AND country = ?';
    params.push(country);
  }

  let dateFilter = '';
  if (date_from) { dateFilter += ' AND created_at >= ?'; params.push(date_from); }
  if (date_to) { dateFilter += ' AND created_at <= ?'; params.push(date_to); }

  const allParams = [...params];

  const [
    total,
    byStatus,
    byCountry,
    byPriority,
    byType,
  ] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter}`).get(...allParams),
    db.prepare(`SELECT status, COUNT(*) as count FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter} GROUP BY status`).all(...allParams),
    db.prepare(`SELECT country, COUNT(*) as count FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter} GROUP BY country`).all(...allParams),
    db.prepare(`SELECT priority, COUNT(*) as count FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter} GROUP BY priority`).all(...allParams),
    db.prepare(`SELECT type, COUNT(*) as count FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter} GROUP BY type`).all(...allParams),
  ]);
  
  // SLA stats
  let slaCountryFilter = '';
  const slaParams: any[] = [];
  if (req.user!.role === 'admin_pays' || req.user!.role === 'superviseur') {
    slaCountryFilter = ' AND country = ?';
    slaParams.push(req.user!.country);
  } else if (country) {
    slaCountryFilter = ' AND country = ?';
    slaParams.push(country);
  }

  const [slaViolations, completed, onTime] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as c FROM sla_violations WHERE 1=1 ${slaCountryFilter}`).get(...slaParams),
    db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE status = 'finalisee' ${countryFilter}`).get(...params),
    db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE status = 'finalisee' AND actual_end_time <= deadline ${countryFilter}`).get(...params),
  ]);
  
  const completedCount = Number((completed as any)?.c || 0);
  const onTimeCount = Number((onTime as any)?.c || 0);
  const slaRate = completedCount > 0 ? ((onTimeCount / completedCount) * 100).toFixed(1) : 100;

  // Average rating
  const avgRating: any = await db.prepare(`SELECT AVG(client_rating) as avg FROM interventions WHERE client_rating IS NOT NULL ${countryFilter}`).get(...params);

  // Planning mode distribution
  const planningModes: any[] = await db.prepare(`SELECT planning_mode, COUNT(*) as count FROM interventions WHERE 1=1 ${countryFilter} ${dateFilter} GROUP BY planning_mode`).all(...allParams);

  // Daily interventions for last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);
  const daily: any[] = await db.prepare(`
    SELECT scheduled_date as date, COUNT(*) as count
    FROM interventions
    WHERE scheduled_date IS NOT NULL AND scheduled_date >= ? ${countryFilter}
    GROUP BY scheduled_date
    ORDER BY scheduled_date
  `).all(sinceDate, ...params);

  // Technician performance
  const techPerformance: any[] = await db.prepare(`
    SELECT t.id, t.first_name, t.last_name, t.country,
           COUNT(i.id) as total_interventions,
           SUM(CASE WHEN i.status = 'finalisee' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN i.status = 'en_retard' THEN 1 ELSE 0 END) as delayed,
           AVG(i.client_rating) as avg_rating
    FROM users t
    LEFT JOIN interventions i ON t.id = i.technician_id
    WHERE t.role = 'technicien' ${countryFilter.replace('country', 't.country')}
    GROUP BY t.id
    ORDER BY completed DESC
    LIMIT 20
  `).all(...params);

  res.json({
    total: total?.c || 0,
    by_status: byStatus,
    by_country: byCountry,
    by_priority: byPriority,
    by_type: byType,
    sla_violations: slaViolations?.c || 0,
    sla_rate: parseFloat(slaRate as string),
    avg_rating: avgRating?.avg ? parseFloat(avgRating.avg.toFixed(1)) : null,
    planning_modes: planningModes,
    daily_interventions: daily,
    technician_performance: techPerformance,
  });
});

// Country breakdown
router.get('/countries', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  
  const countries = ['DE', 'BE', 'FR', 'LU'];
  const result = await Promise.all(countries.map(async (code) => {
    const [total, active, delayed, techs, completed, onTime] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ?`).get(code),
      db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ? AND status NOT IN ('finalisee','annulee')`).get(code),
      db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ? AND status = 'en_retard'`).get(code),
      db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'technicien' AND country = ? AND is_active = 1`).get(code),
      db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ? AND status = 'finalisee'`).get(code),
      db.prepare(`SELECT COUNT(*) as c FROM interventions WHERE country = ? AND status = 'finalisee' AND actual_end_time <= deadline`).get(code),
    ]);

    return {
      code,
      total: (total as any)?.c || 0,
      active: (active as any)?.c || 0,
      delayed: (delayed as any)?.c || 0,
      technicians: (techs as any)?.c || 0,
      sla_rate: (completed as any)?.c > 0 ? (((onTime as any)?.c || 0) / (completed as any).c * 100) : 100,
    };
  }));

  res.json(result);
});

// Notifications
router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const notifications = await db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user!.id);
  res.json(notifications);
});

router.post('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  await db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// Clients CRUD
router.get('/clients', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { country, search } = req.query;
  
  let query = 'SELECT * FROM clients WHERE 1=1';
  const params: any[] = [];

  // Country-level admins/supervisors are restricted to their own country
  if (req.user!.role !== 'super_admin') {
    query += ' AND country = ?';
    params.push(req.user!.country);
  }
  
  // Super admin may optionally filter by country
  if (req.user!.role === 'super_admin' && country) { query += ' AND country = ?'; params.push(country); }
  if (search) { query += ' AND (first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
  
  query += ' ORDER BY created_at DESC';
  res.json(await db.prepare(query).all(...params));
});

router.post('/clients', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { v4: uuidGen } = require('uuid');
  const { type, company_name, first_name, last_name, email, phone, address, city, postal_code, country, latitude, longitude, language } = req.body;

  const finalCountry = req.user!.role === 'super_admin' ? country : req.user!.country;

  const id = uuidGen();
  await db.prepare(`INSERT INTO clients (id, type, company_name, first_name, last_name, email, phone, address, city, postal_code, country, latitude, longitude, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, type, company_name || null, first_name, last_name, email || null, phone || null,
    address, city, postal_code, finalCountry, latitude || null, longitude || null, language || 'fr'
  );

  res.status(201).json({ id, type, first_name, last_name, country: finalCountry });
});

// SLA violations report
router.get('/sla-report', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { country } = req.query;

  let filter = '';
  const params: any[] = [];
  if (country) { filter = ' AND sv.country = ?'; params.push(country); }
  if (req.user!.role === 'admin_pays' || req.user!.role === 'superviseur') { filter += ' AND sv.country = ?'; params.push(req.user!.country); }

  const violations: any[] = await db.prepare(`
    SELECT sv.*, i.reference, i.type, i.city, i.delay_category
    FROM sla_violations sv
    JOIN interventions i ON sv.intervention_id = i.id
    WHERE 1=1 ${filter}
    ORDER BY sv.created_at DESC
  `).all(...params);

  const byCategory: any[] = await db.prepare(`
    SELECT i.delay_category, COUNT(*) as count
    FROM sla_violations sv
    JOIN interventions i ON sv.intervention_id = i.id
    WHERE i.delay_category IS NOT NULL ${filter}
    GROUP BY i.delay_category
  `).all(...params);

  const byCountry: any[] = await db.prepare(`
    SELECT sv.country, COUNT(*) as count
    FROM sla_violations sv WHERE 1=1 ${filter}
    GROUP BY sv.country
  `).all(...params);

  res.json({ violations, by_category: byCategory, by_country: byCountry });
});

export default router;
