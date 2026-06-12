import { DatabaseSync } from 'node:sqlite';

let db;

export function openDB(path = 'leads.db') {
  db = new DatabaseSync(path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      input         TEXT UNIQUE NOT NULL,
      domain        TEXT,
      instagram     TEXT,
      is_shopify    INTEGER,
      store_name    TEXT,
      product_count INTEGER,
      founder_name  TEXT,
      email         TEXT,
      about_url     TEXT,
      is_us         INTEGER,
      us_reason     TEXT,
      solo_score    INTEGER,
      solo_reason   TEXT,
      score         INTEGER,
      status        TEXT DEFAULT 'pending',
      checked_at    TEXT
    );
  `);

  const existingCols = new Set(
    db.prepare(`PRAGMA table_info(leads)`).all().map(r => r.name)
  );

  const newColumns = {
    phone: 'TEXT',
    linkedin: 'TEXT',
    facebook: 'TEXT',
    tiktok: 'TEXT',
    contact_form_url: 'TEXT',
    contact_url: 'TEXT',
    compliment: 'TEXT',
  };

  for (const [col, type] of Object.entries(newColumns)) {
    if (!existingCols.has(col)) {
      db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${type}`);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS outreach (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      input       TEXT NOT NULL,
      domain      TEXT,
      sent_at     TEXT,
      status      TEXT DEFAULT 'pending',
      notes       TEXT
    );
  `);

  return db;
}

export function getDB() {
  return db;
}

export function upsertInput(input) {
  db.prepare(`
    INSERT INTO leads (input, status)
    VALUES (?, 'pending')
    ON CONFLICT(input) DO NOTHING
  `).run(input);
}

export function getPending() {
  return db.prepare(`SELECT * FROM leads WHERE status = 'pending'`).all();
}

export function updateLead(input, fields) {
  const keys = Object.keys(fields);
  const set = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  db.prepare(`UPDATE leads SET ${set} WHERE input = ?`).run(...vals, input);
}

export function getAllLeads() {
  return db.prepare(`SELECT * FROM leads ORDER BY score DESC`).all();
}

function upsertOutreach(input, status, notes, setSentAt) {
  const existing = db.prepare(`SELECT id FROM outreach WHERE input = ?`).get(input);
  if (existing) {
    if (setSentAt) {
      db.prepare(`UPDATE outreach SET status = ?, sent_at = ?, notes = ? WHERE input = ?`)
        .run(status, new Date().toISOString(), notes ?? null, input);
    } else {
      db.prepare(`UPDATE outreach SET status = ?, notes = ? WHERE input = ?`)
        .run(status, notes ?? null, input);
    }
  } else {
    db.prepare(`INSERT INTO outreach (input, sent_at, status, notes) VALUES (?, ?, ?, ?)`)
      .run(input, setSentAt ? new Date().toISOString() : null, status, notes ?? null);
  }
}

export function markSent(input, notes) {
  upsertOutreach(input, 'sent', notes, true);
}

export function markReplied(input, notes) {
  upsertOutreach(input, 'replied', notes, false);
}

export function markSkipped(input, notes) {
  upsertOutreach(input, 'not_interested', notes, false);
}

export function getOutreach() {
  return db.prepare(`
    SELECT outreach.*, leads.domain AS lead_domain, leads.store_name, leads.score
    FROM outreach
    LEFT JOIN leads ON leads.input = outreach.input
  `).all();
}