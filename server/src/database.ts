import path from 'path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

type QueryResultRow = Record<string, any>;

export type PreparedStatement = {
  all: (...params: any[]) => Promise<QueryResultRow[]>;
  get: (...params: any[]) => Promise<QueryResultRow | undefined>;
  run: (...params: any[]) => Promise<{ rowCount: number }>; // sqlite-style naming
};

export type Db = {
  prepare: (sql: string) => PreparedStatement;
  query: (sql: string, params?: any[]) => Promise<{ rows: QueryResultRow[]; rowCount: number }>;
};

type DbMode = 'postgres' | 'sqlite';

const SQLITE_DB_PATH = path.join(__dirname, '..', 'data', 'fibre.db');

let mode: DbMode | null = null;
let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getMode(): DbMode {
  if (mode) return mode;
  mode = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
  return mode;
}

function ensureSqliteDb(): Database.Database {
  if (sqliteDb) return sqliteDb;
  const fs = require('fs');
  const dir = path.dirname(SQLITE_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqliteDb = new Database(SQLITE_DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  return sqliteDb;
}

function ensurePgPool(): Pool {
  if (pgPool) return pgPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required for Postgres mode');
  pgPool = new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'false' ? undefined : ({ rejectUnauthorized: false } as any),
  });
  return pgPool;
}

function transformSqlForPg(sql: string): string {
  // Convert SQLite-style placeholders and functions to Postgres
  let i = 0;
  return sql
    .replace(/datetime\('now'\)/g, 'now()')
    .replace(/\?/g, () => `$${++i}`);
}

async function queryPg(sql: string, params: any[] = []) {
  const p = ensurePgPool();
  const res = await p.query(transformSqlForPg(sql), params);
  return { rows: res.rows as QueryResultRow[], rowCount: res.rowCount || 0 };
}

async function querySqlite(sql: string, params: any[] = []) {
  const dbi = ensureSqliteDb();
  const stmt = dbi.prepare(sql);
  // Heuristic: if it begins with SELECT, return rows; else run.
  if (/^\s*select\b/i.test(sql)) {
    const rows = stmt.all(...params) as QueryResultRow[];
    return { rows, rowCount: rows.length };
  }
  const info = stmt.run(...params);
  return { rows: [], rowCount: info.changes };
}

const db: Db = {
  prepare: (sql: string) => ({
    all: async (...params: any[]) => {
      const r = getMode() === 'postgres' ? await queryPg(sql, params) : await querySqlite(sql, params);
      return r.rows;
    },
    get: async (...params: any[]) => {
      const r = getMode() === 'postgres' ? await queryPg(sql, params) : await querySqlite(sql, params);
      return r.rows[0];
    },
    run: async (...params: any[]) => {
      const r = getMode() === 'postgres' ? await queryPg(sql, params) : await querySqlite(sql, params);
      return { rowCount: r.rowCount };
    },
  }),
  query: async (sql: string, params: any[] = []) => {
    return getMode() === 'postgres' ? queryPg(sql, params) : querySqlite(sql, params);
  },
};

export function getDb(): Db {
  if (getMode() === 'postgres') ensurePgPool();
  else ensureSqliteDb();
  return db;
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = getMode() === 'postgres' ? initPostgres() : initSqlite();
  return initPromise;
}

async function initPostgres(): Promise<void> {
  // Core schema (keep TEXT for timestamps for easy ISO comparisons)
  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      country TEXT,
      region TEXT,
      city TEXT,
      photo_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (now()::text),
      updated_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS technician_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      certifications TEXT DEFAULT '[]',
      skills TEXT DEFAULT '[]',
      max_daily_interventions INTEGER DEFAULT 6,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      current_latitude DOUBLE PRECISION,
      current_longitude DOUBLE PRECISION,
      is_available INTEGER DEFAULT 1,
      work_start_time TEXT DEFAULT '08:00',
      work_end_time TEXT DEFAULT '18:00',
      working_days TEXT DEFAULT '[1,2,3,4,5]',
      zone_radius_km DOUBLE PRECISION DEFAULT 50,
      vehicle_type TEXT DEFAULT 'van'
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      company_name TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      language TEXT DEFAULT 'fr',
      created_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS interventions (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      client_id TEXT REFERENCES clients(id),
      technician_id TEXT REFERENCES users(id),
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      priority TEXT NOT NULL DEFAULT 'normale',
      status TEXT NOT NULL DEFAULT 'en_attente',
      sla_hours INTEGER DEFAULT 48,
      deadline TEXT,
      scheduled_date TEXT,
      scheduled_start_time TEXT,
      scheduled_end_time TEXT,
      actual_start_time TEXT,
      actual_end_time TEXT,
      planning_mode TEXT DEFAULT 'auto',
      planning_score DOUBLE PRECISION,
      manual_override_reason TEXT,
      manual_override_by TEXT REFERENCES users(id),
      client_token TEXT UNIQUE,
      client_token_expires TEXT,
      report TEXT,
      photos TEXT DEFAULT '[]',
      signature_url TEXT,
      client_rating INTEGER,
      client_comment TEXT,
      delay_reason TEXT,
      delay_category TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (now()::text),
      updated_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS intervention_history (
      id TEXT PRIMARY KEY,
      intervention_id TEXT REFERENCES interventions(id),
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      performed_by TEXT,
      performed_by_role TEXT,
      notes TEXT,
      is_manual_override INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS technician_schedule (
      id TEXT PRIMARY KEY,
      technician_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      intervention_id TEXT REFERENCES interventions(id),
      is_blocked INTEGER DEFAULT 0,
      block_reason TEXT,
      created_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE TABLE IF NOT EXISTS sla_violations (
      id TEXT PRIMARY KEY,
      intervention_id TEXT REFERENCES interventions(id),
      violation_type TEXT NOT NULL,
      expected_time TEXT,
      actual_time TEXT,
      delay_minutes INTEGER,
      justification TEXT,
      justified_by TEXT REFERENCES users(id),
      country TEXT,
      created_at TEXT DEFAULT (now()::text)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_country ON interventions(country)`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id)`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_client ON interventions(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(scheduled_date)`,
    `CREATE INDEX IF NOT EXISTS idx_interventions_token ON interventions(client_token)`,
    `CREATE INDEX IF NOT EXISTS idx_history_intervention ON intervention_history(intervention_id)`,
    `CREATE INDEX IF NOT EXISTS idx_schedule_tech_date ON technician_schedule(technician_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`,
  ];

  for (const stmt of statements) {
    await queryPg(stmt);
  }

  const existingAdmin = await db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('super_admin');
  if (!existingAdmin) await seedData();
}

async function initSqlite(): Promise<void> {
  const dbi = ensureSqliteDb();

  dbi.exec(`
    -- Users & Roles
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('super_admin','admin_pays','superviseur','technicien')),
      country TEXT CHECK(country IN ('DE','BE','FR','LU')),
      region TEXT,
      city TEXT,
      photo_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Technician details
    CREATE TABLE IF NOT EXISTS technician_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      certifications TEXT DEFAULT '[]',
      skills TEXT DEFAULT '[]',
      max_daily_interventions INTEGER DEFAULT 6,
      latitude REAL,
      longitude REAL,
      current_latitude REAL,
      current_longitude REAL,
      is_available INTEGER DEFAULT 1,
      work_start_time TEXT DEFAULT '08:00',
      work_end_time TEXT DEFAULT '18:00',
      working_days TEXT DEFAULT '[1,2,3,4,5]',
      zone_radius_km REAL DEFAULT 50,
      vehicle_type TEXT DEFAULT 'van'
    );

    -- Clients
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('particulier','entreprise')),
      company_name TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL CHECK(country IN ('DE','BE','FR','LU')),
      latitude REAL,
      longitude REAL,
      language TEXT DEFAULT 'fr' CHECK(language IN ('fr','de','en')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Interventions
    CREATE TABLE IF NOT EXISTS interventions (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'installation_fibre','depannage','maintenance',
        'raccordement','soudure','tirage_cable','audit_technique','mise_en_service'
      )),
      description TEXT,
      client_id TEXT REFERENCES clients(id),
      technician_id TEXT REFERENCES users(id),
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL CHECK(country IN ('DE','BE','FR','LU')),
      latitude REAL,
      longitude REAL,
      priority TEXT NOT NULL DEFAULT 'normale' CHECK(priority IN ('critique','haute','normale','basse')),
      status TEXT NOT NULL DEFAULT 'en_attente' CHECK(status IN (
        'en_attente','planifiee_auto','confirmee','en_cours',
        'en_retard','reportee','finalisee','annulee'
      )),
      sla_hours INTEGER DEFAULT 48,
      deadline TEXT,
      scheduled_date TEXT,
      scheduled_start_time TEXT,
      scheduled_end_time TEXT,
      actual_start_time TEXT,
      actual_end_time TEXT,
      planning_mode TEXT DEFAULT 'auto' CHECK(planning_mode IN ('auto','manual')),
      planning_score REAL,
      manual_override_reason TEXT,
      manual_override_by TEXT REFERENCES users(id),
      client_token TEXT UNIQUE,
      client_token_expires TEXT,
      report TEXT,
      photos TEXT DEFAULT '[]',
      signature_url TEXT,
      client_rating INTEGER CHECK(client_rating BETWEEN 1 AND 5),
      client_comment TEXT,
      delay_reason TEXT,
      delay_category TEXT CHECK(delay_category IN (
        'trafic','client_absent','probleme_technique',
        'meteo','materiel','autre'
      )),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Intervention history / audit log
    CREATE TABLE IF NOT EXISTS intervention_history (
      id TEXT PRIMARY KEY,
      intervention_id TEXT REFERENCES interventions(id),
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      performed_by TEXT,
      performed_by_role TEXT,
      notes TEXT,
      is_manual_override INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Technician availability / schedule
    CREATE TABLE IF NOT EXISTS technician_schedule (
      id TEXT PRIMARY KEY,
      technician_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      intervention_id TEXT REFERENCES interventions(id),
      is_blocked INTEGER DEFAULT 0,
      block_reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- SLA tracking
    CREATE TABLE IF NOT EXISTS sla_violations (
      id TEXT PRIMARY KEY,
      intervention_id TEXT REFERENCES interventions(id),
      violation_type TEXT NOT NULL,
      expected_time TEXT,
      actual_time TEXT,
      delay_minutes INTEGER,
      justification TEXT,
      justified_by TEXT REFERENCES users(id),
      country TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
    CREATE INDEX IF NOT EXISTS idx_interventions_country ON interventions(country);
    CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id);
    CREATE INDEX IF NOT EXISTS idx_interventions_client ON interventions(client_id);
    CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_interventions_token ON interventions(client_token);
    CREATE INDEX IF NOT EXISTS idx_history_intervention ON intervention_history(intervention_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_tech_date ON technician_schedule(technician_id, date);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  const existingAdmin = dbi.prepare('SELECT id FROM users WHERE role = ?').get('super_admin');
  if (!existingAdmin) {
    await seedData();
  }
}

async function seedData() {
  const { v4: uuid } = require('uuid');
  const hash = bcrypt.hashSync('admin123', 10);
  const dbi = getDb();

  // Super Admin
  const adminId = uuid();
  await dbi.prepare(`INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    adminId, 'admin@fibreeurope.com', hash, 'Admin', 'Europe', '+33600000000', 'super_admin', 'FR'
  );

  // Country admins
  const countries = [
    { code: 'FR', email: 'admin@fibre-france.com', first: 'Pierre', last: 'Dupont' },
    { code: 'DE', email: 'admin@fibre-deutschland.com', first: 'Hans', last: 'Mueller' },
    { code: 'BE', email: 'admin@fibre-belgique.com', first: 'Marc', last: 'Janssens' },
    { code: 'LU', email: 'admin@fibre-luxembourg.com', first: 'Jean', last: 'Weber' },
  ];
  for (const c of countries) {
    await dbi.prepare(`INSERT INTO users (id, email, password_hash, first_name, last_name, role, country)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(uuid(), c.email, hash, c.first, c.last, 'admin_pays', c.code);
  }

  // Supervisors
  const supervisors = [
    { country: 'FR', region: 'Île-de-France', email: 'sup.idf@fibre.com', first: 'Sophie', last: 'Martin', city: 'Paris' },
    { country: 'FR', region: 'PACA', email: 'sup.paca@fibre.com', first: 'Luc', last: 'Bernard', city: 'Marseille' },
    { country: 'DE', region: 'Bayern', email: 'sup.bayern@fibre.com', first: 'Klaus', last: 'Schmidt', city: 'München' },
    { country: 'BE', region: 'Bruxelles', email: 'sup.bxl@fibre.com', first: 'Paul', last: 'Petit', city: 'Bruxelles' },
    { country: 'LU', region: 'Luxembourg', email: 'sup.lux@fibre.com', first: 'Max', last: 'Schmit', city: 'Luxembourg' },
  ];
  for (const s of supervisors) {
    await dbi.prepare(`INSERT INTO users (id, email, password_hash, first_name, last_name, role, country, region, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuid(), s.email, hash, s.first, s.last, 'superviseur', s.country, s.region, s.city);
  }

  // Technicians with profiles
  const technicians = [
    { country: 'FR', region: 'Île-de-France', city: 'Paris', email: 'tech1.paris@fibre.com', first: 'Karim', last: 'Benali', lat: 48.8566, lng: 2.3522, certs: ['fibre_optique', 'soudure', 'FTTH'], skills: ['installation_fibre', 'raccordement', 'soudure'] },
    { country: 'FR', region: 'Île-de-France', city: 'Versailles', email: 'tech2.paris@fibre.com', first: 'Thomas', last: 'Leroy', lat: 48.8049, lng: 2.1204, certs: ['fibre_optique', 'FTTH'], skills: ['installation_fibre', 'depannage', 'maintenance'] },
    { country: 'FR', region: 'PACA', city: 'Marseille', email: 'tech.marseille@fibre.com', first: 'Julien', last: 'Roux', lat: 43.2965, lng: 5.3698, certs: ['fibre_optique', 'soudure'], skills: ['installation_fibre', 'soudure', 'tirage_cable'] },
    { country: 'DE', region: 'Bayern', city: 'München', email: 'tech.munich@fibre.com', first: 'Stefan', last: 'Braun', lat: 48.1351, lng: 11.582, certs: ['fibre_optique', 'FTTH', 'soudure'], skills: ['installation_fibre', 'depannage', 'raccordement'] },
    { country: 'DE', region: 'Bayern', city: 'Nürnberg', email: 'tech.nurnberg@fibre.com', first: 'Felix', last: 'Wagner', lat: 49.4521, lng: 11.0767, certs: ['fibre_optique'], skills: ['installation_fibre', 'maintenance'] },
    { country: 'BE', region: 'Bruxelles', city: 'Bruxelles', email: 'tech.bruxelles@fibre.com', first: 'Antoine', last: 'Dubois', lat: 50.8503, lng: 4.3517, certs: ['fibre_optique', 'soudure', 'FTTH'], skills: ['installation_fibre', 'soudure', 'raccordement'] },
    { country: 'BE', region: 'Bruxelles', city: 'Gand', email: 'tech.gand@fibre.com', first: 'Pieter', last: 'Vos', lat: 51.0543, lng: 3.7174, certs: ['fibre_optique'], skills: ['installation_fibre', 'depannage'] },
    { country: 'LU', region: 'Luxembourg', city: 'Luxembourg', email: 'tech.lux@fibre.com', first: 'Nicolas', last: 'Reuter', lat: 49.6116, lng: 6.1319, certs: ['fibre_optique', 'soudure', 'FTTH'], skills: ['installation_fibre', 'soudure', 'raccordement', 'depannage'] },
  ];
  for (const t of technicians) {
    const id = uuid();
    await dbi.prepare(`INSERT INTO users (id, email, password_hash, first_name, last_name, role, country, region, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, t.email, hash, t.first, t.last, 'technicien', t.country, t.region, t.city);
    await dbi.prepare(`INSERT INTO technician_profiles (user_id, certifications, skills, latitude, longitude, current_latitude, current_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, JSON.stringify(t.certs), JSON.stringify(t.skills), t.lat, t.lng, t.lat, t.lng);
  }

  // Demo clients
  const clients = [
    { id: uuid(), type: 'particulier', company_name: null, first_name: 'Marie', last_name: 'Durand', email: 'marie.durand@email.com', phone: '+33612345678', address: '15 Rue de Rivoli', city: 'Paris', postal_code: '75001', country: 'FR', latitude: 48.8566, longitude: 2.3522, language: 'fr' },
    { id: uuid(), type: 'entreprise', company_name: 'TechCorp GmbH', first_name: 'Anna', last_name: 'Fischer', email: 'anna@techcorp.de', phone: '+4917612345', address: 'Marienplatz 1', city: 'München', postal_code: '80331', country: 'DE', latitude: 48.1372, longitude: 11.5756, language: 'de' },
    { id: uuid(), type: 'particulier', company_name: null, first_name: 'Louis', last_name: 'Lambert', email: 'louis.lambert@email.be', phone: '+32478123456', address: 'Rue Neuve 1', city: 'Bruxelles', postal_code: '1000', country: 'BE', latitude: 50.8503, longitude: 4.3517, language: 'fr' },
    { id: uuid(), type: 'entreprise', company_name: 'LuxFibre SA', first_name: 'Emma', last_name: 'Hoffmann', email: 'emma@luxfibre.lu', phone: '+352621123456', address: '1 Avenue de la Gare', city: 'Luxembourg', postal_code: '1611', country: 'LU', latitude: 49.6116, longitude: 6.1319, language: 'fr' },
  ];
  for (const c of clients) {
    await dbi.prepare(`INSERT INTO clients (id, type, company_name, first_name, last_name, email, phone, address, city, postal_code, country, latitude, longitude, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      c.id, c.type, c.company_name, c.first_name, c.last_name, c.email, c.phone, c.address, c.city, c.postal_code, c.country, c.latitude, c.longitude, c.language
    );
  }
}
