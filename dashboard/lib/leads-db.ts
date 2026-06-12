import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;
let writeDb: Database.Database | null = null;

export function getDB() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "..", "leads.db");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return db;
}

// Separate read-write connection for the outreach table, which the
// dashboard owns (the CLI tool only reads/joins it).
export function getWriteDB() {
  if (!writeDb) {
    const dbPath = path.join(process.cwd(), "..", "leads.db");
    writeDb = new Database(dbPath);
    writeDb.exec(`
      CREATE TABLE IF NOT EXISTS outreach (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        input       TEXT NOT NULL,
        domain      TEXT,
        sent_at     TEXT,
        status      TEXT DEFAULT 'pending',
        notes       TEXT
      );
    `);
  }
  return writeDb;
}

export interface Lead {
  input: string;
  domain: string | null;
  instagram: string | null;
  is_shopify: number | null;
  store_name: string | null;
  product_count: number | null;
  founder_name: string | null;
  email: string | null;
  about_url: string | null;
  is_us: number | null;
  us_reason: string | null;
  solo_score: number | null;
  solo_reason: string | null;
  score: number | null;
  status: string | null;
  checked_at: string | null;
  phone: string | null;
  linkedin: string | null;
  facebook: string | null;
  tiktok: string | null;
  contact_form_url: string | null;
  contact_url: string | null;
  compliment: string | null;
}

export interface OutreachRow {
  id: number;
  input: string;
  domain: string | null;
  sent_at: string | null;
  status: string;
  notes: string | null;
}

export function getAllLeads(): Lead[] {
  return getDB().prepare("SELECT * FROM leads ORDER BY score DESC").all() as Lead[];
}

export function getOutreach(): OutreachRow[] {
  return getWriteDB().prepare("SELECT * FROM outreach").all() as OutreachRow[];
}

export function setOutreachStatus(
  input: string,
  domain: string | null,
  status: string,
  notes: string | null,
) {
  const conn = getWriteDB();
  const existing = conn.prepare("SELECT id FROM outreach WHERE input = ?").get(input);
  const sentAt = status === "sent" ? new Date().toISOString() : null;

  if (existing) {
    conn
      .prepare(
        "UPDATE outreach SET domain = COALESCE(?, domain), status = ?, sent_at = COALESCE(?, sent_at), notes = ? WHERE input = ?",
      )
      .run(domain, status, sentAt, notes, input);
  } else {
    conn
      .prepare(
        "INSERT INTO outreach (input, domain, sent_at, status, notes) VALUES (?, ?, ?, ?, ?)",
      )
      .run(input, domain, sentAt, status, notes);
  }
}
