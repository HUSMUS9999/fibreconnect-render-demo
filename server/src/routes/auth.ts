import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database';
import { AuthRequest, authMiddleware, generateToken, requireRole } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const db = getDb();
  
  const user: any = await db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role, country: user.country });
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      country: user.country,
      region: user.region,
      city: user.city,
      photo_url: user.photo_url,
    }
  });
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const user: any = await db.prepare('SELECT id, email, first_name, last_name, role, country, region, city, phone, photo_url FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }
  res.json(user);
});

// List users
router.get('/users', authMiddleware, requireRole('super_admin', 'admin_pays', 'superviseur'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { role, country, search } = req.query;
  
  let query = `SELECT id, email, first_name, last_name, role, country, region, city, phone, is_active, created_at FROM users WHERE 1=1`;
  const params: any[] = [];

  if (req.user!.role === 'admin_pays') {
    query += ' AND country = ?';
    params.push(req.user!.country);
  }
  if (role) { query += ' AND role = ?'; params.push(role); }
  if (country && req.user!.role === 'super_admin') { query += ' AND country = ?'; params.push(country); }
  if (search) { query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  
  query += ' ORDER BY created_at DESC';
  
  const users = await db.prepare(query).all(...params);
  res.json(users);
});

// Get technicians with profiles
router.get('/technicians', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { country } = req.query;
  
  let query = `
    SELECT u.id, u.email, u.first_name, u.last_name, u.country, u.region, u.city, u.phone,
           tp.certifications, tp.skills, tp.max_daily_interventions, tp.latitude, tp.longitude,
           tp.current_latitude, tp.current_longitude, tp.is_available, tp.work_start_time, tp.work_end_time
    FROM users u
    JOIN technician_profiles tp ON u.id = tp.user_id
    WHERE u.role = 'technicien' AND u.is_active = 1
  `;
  const params: any[] = [];

  if (country) { query += ' AND u.country = ?'; params.push(country); }
  if (req.user!.role === 'admin_pays') {
    query += ' AND u.country = ?';
    params.push(req.user!.country);
  }

  const technicians = await db.prepare(query).all(...params);
  res.json(technicians.map((t: any) => ({
    ...t,
    certifications: JSON.parse(t.certifications || '[]'),
    skills: JSON.parse(t.skills || '[]'),
  })));
});

// Create user
router.post('/users', authMiddleware, requireRole('super_admin', 'admin_pays'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { v4: uuid } = require('uuid');
  const { email, password, first_name, last_name, phone, role, country, region, city, certifications, skills } = req.body;

  if (req.user!.role === 'admin_pays' && country !== req.user!.country) {
    res.status(403).json({ error: 'Vous ne pouvez créer des utilisateurs que dans votre pays' });
    return;
  }

  const id = uuid();
  const hash = bcrypt.hashSync(password || 'default123', 10);

  try {
    await db.prepare(`INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, country, region, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, email, hash, first_name, last_name, phone || null, role, country, region || null, city || null
    );

    if (role === 'technicien') {
      await db.prepare(`INSERT INTO technician_profiles (user_id, certifications, skills)
        VALUES (?, ?, ?)`).run(
        id, JSON.stringify(certifications || []), JSON.stringify(skills || [])
      );
    }

    res.status(201).json({ id, email, first_name, last_name, role, country });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update user
router.put('/users/:id', authMiddleware, requireRole('super_admin', 'admin_pays'), async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { first_name, last_name, phone, role, country, region, city, is_active, certifications, skills } = req.body;

  await db.prepare(`UPDATE users SET first_name = ?, last_name = ?, phone = ?, role = ?, country = ?, region = ?, city = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?`).run(
    first_name, last_name, phone, role, country, region, city, is_active ?? 1, req.params.id
  );

  if (role === 'technicien' && (certifications || skills)) {
    await db.prepare(`UPDATE technician_profiles SET certifications = ?, skills = ? WHERE user_id = ?`).run(
      JSON.stringify(certifications || []), JSON.stringify(skills || []), req.params.id
    );
  }

  res.json({ success: true });
});

export default router;
