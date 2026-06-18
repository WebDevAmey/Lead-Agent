import { readFileSync, writeFileSync } from 'node:fs';
import { openDB, upsertInput, getPending, updateLead, getAllLeads } from './lib/db.js';
import { get } from './lib/http.js';
import { verifyShopify } from './lib/shopify.js';
import { scrapeStore } from './lib/scrape.js';
import { scoreUS, scoreSolo, finalScore } from './lib/score.js';

const CONCURRENCY = 4;
const GAP_MS = 150;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function parseInput(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function normalizeToDomains(input) {
  if (input.includes('.')) return [input.replace(/^https?:\/\//, '').replace(/\/$/, '')];
  const handle = input.replace(/^@/, '');
  const slug = handle.replace(/\s+/g, '');
  const candidates = [...new Set([`${handle}.com`, `${slug}.com`])];
  return candidates;
}

async function processRow(row) {
  const input = row.input;
  console.log(`\n→ Processing: ${input}`);

  const candidates = normalizeToDomains(input);
  let shopifyResult = null;
  let resolvedDomain = null;

  for (const domain of candidates) {
    const r = await verifyShopify(domain);
    if (r) { shopifyResult = r; resolvedDomain = domain; break; }
  }

  if (!resolvedDomain) {
    const status = candidates.length > 1 ? 'needs_domain' : 'not_shopify';
    console.log(`  ✗ ${status}`);
    updateLead(input, { status, domain: candidates[0], checked_at: new Date().toISOString() });
    return;
  }

  if (!shopifyResult) {
    console.log(`  ✗ not_shopify`);
    updateLead(input, { status: 'not_shopify', domain: resolvedDomain, checked_at: new Date().toISOString() });
    return;
  }

  console.log(`  ✓ Shopify — ${shopifyResult.productCount} products, currency: ${shopifyResult.currency}`);

  const signals = await scrapeStore(resolvedDomain);
  const { isUS, usPts, usReason } = scoreUS(signals, shopifyResult.currency);
  const { solo, soloReason } = scoreSolo(signals);
  const score = finalScore({ isUS, usPts, solo, signals, productCount: shopifyResult.productCount });

  console.log(`  score=${score} isUS=${isUS} solo=${solo} founder=${signals.founderName}`);

  updateLead(input, {
    domain: resolvedDomain,
    is_shopify: 1,
    store_name: signals.storeName,
    product_count: shopifyResult.productCount,
    founder_name: signals.founderName,
    email: signals.email,
    about_url: signals.aboutUrl,
    is_us: isUS ? 1 : 0,
    us_reason: usReason,
    solo_score: solo,
    solo_reason: soloReason,
    score,
    status: 'done',
    checked_at: new Date().toISOString(),
    phone: signals.phone,
    instagram: signals.instagram,
    linkedin: signals.linkedin,
    facebook: signals.facebook,
    tiktok: signals.tiktok,
    contact_form_url: signals.contactFormUrl,
    contact_url: signals.contactUrl,
    compliment: signals.compliment,
  });
}

async function runPool(rows) {
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const row = rows[i++];
      await processRow(row);
      await sleep(GAP_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

const SOURCE_GROUPS = ['plus.html', 'india.html', null];

async function exportCSV() {
  const leads = getAllLeads();
  if (!leads.length) return;
  const headers = Object.keys(leads[0]);
  const lines = [headers.join(',')];
  for (const source of SOURCE_GROUPS) {
    const group = leads.filter(row => (row.source ?? null) === source);
    if (!group.length) continue;
    if (lines.length > 1) lines.push('');
    for (const row of group) {
      lines.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    }
  }
  writeFileSync('leads.csv', lines.join('\n'));
  console.log(`\n📄 Exported ${leads.length} rows to leads.csv`);
}

// ── main ──
const inputFile = process.argv[2] || 'input.txt';
let raw;
try { raw = readFileSync(inputFile, 'utf8'); }
catch { console.error(`Cannot read ${inputFile}`); process.exit(1); }

openDB();
const inputs = parseInput(raw);
for (const inp of inputs) upsertInput(inp);

const pending = getPending();
console.log(`\n🔍 ${pending.length} pending rows from ${inputs.length} total inputs\n`);

await runPool(pending);

// Summary
const all = getAllLeads();
const summary = {};
for (const r of all) summary[r.status] = (summary[r.status] || 0) + 1;
console.log('\n── Summary ──');
for (const [s, n] of Object.entries(summary)) console.log(`  ${s}: ${n}`);

// Enrichment stats
const done = all.filter(r => r.status === 'done');
const withCount = (key) => done.filter(r => r[key]).length;
console.log('\n── Enrichment Stats ──');
console.log(`  Emails found: ${withCount('email')}/${done.length}`);
console.log(`  Instagram found: ${withCount('instagram')}/${done.length}`);
console.log(`  Founder names found: ${withCount('founder_name')}/${done.length}`);
console.log(`  Contact forms found: ${withCount('contact_form_url')}/${done.length}`);

await exportCSV();