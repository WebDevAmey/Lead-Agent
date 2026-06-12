import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDB() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "..", "leads.db");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return db;
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
}

export function getAllLeads(): Lead[] {
  return getDB().prepare("SELECT * FROM leads ORDER BY score DESC").all() as Lead[];
}
