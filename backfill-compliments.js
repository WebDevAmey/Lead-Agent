import { openDB, getAllLeads, updateLead } from './lib/db.js';
import { scrapeStore } from './lib/scrape.js';

const CONCURRENCY = 4;
const GAP_MS = 150;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

openDB();

const targets = getAllLeads().filter(
  row => row.status === 'done' && row.domain && !row.compliment
);

console.log(`\n💬 ${targets.length} lead(s) missing a compliment\n`);

async function processRow(row) {
  console.log(`→ ${row.domain}`);
  const signals = await scrapeStore(row.domain);
  updateLead(row.input, { compliment: signals.compliment });
  console.log(`  "${signals.compliment}"`);
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

await runPool(targets);

console.log(`\nDone — backfilled ${targets.length} compliment(s).`);
