import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { load } from 'cheerio';
import { verifyShopify } from './lib/shopify.js';
import { openDB, upsertInput, updateLead } from './lib/db.js';

const INPUT_FILE = 'input.txt';
const FILES = ['plus.html', 'india.html'];
const CONCURRENCY = 4;
const GAP_MS = 150;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadExistingDomains() {
  if (!existsSync(INPUT_FILE)) return new Set();
  const lines = readFileSync(INPUT_FILE, 'utf8').split('\n');
  const domains = new Set();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    domains.add(trimmed.toLowerCase());
  }
  return domains;
}

function extractDomains(html) {
  // these files are bare <tbody> fragments without a <table> wrapper, so
  // HTML tree-building rules would otherwise drop the tr/td elements.
  const $ = load(html, { xmlMode: true });
  const domains = new Set();

  $('tr[data-domain]').each((_, el) => {
    const domain = $(el).attr('data-domain')?.toLowerCase().trim();
    if (!domain) return;
    domains.add(domain);
  });

  return [...domains];
}

const existing = loadExistingDomains();
const domainSource = new Map();

for (const file of FILES) {
  if (!existsSync(file)) {
    console.log(`  [skip] ${file} not found`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const domains = extractDomains(html);
  console.log(`${file}: ${domains.length} candidate domain(s)`);
  domains.forEach(d => domainSource.set(d, file));
}

openDB();

let backfilled = 0;
for (const domain of existing) {
  const source = domainSource.get(domain);
  if (source) {
    updateLead(domain, { source });
    backfilled++;
  }
}

const toCheck = [...domainSource.keys()].filter(d => !existing.has(d));
console.log(`\n${domainSource.size} total candidates, ${toCheck.length} not already in input.txt, ${backfilled} backfilled with source\n`);

const newDomains = [];

async function processDomain(domain) {
  console.log(`checking ${domain}...`);
  const result = await verifyShopify(domain);
  if (result) {
    console.log(`  ✓ shopify`);
    newDomains.push(domain);
    upsertInput(domain);
    updateLead(domain, { source: domainSource.get(domain) });
  } else {
    console.log(`  ✗ skip`);
  }
}

async function runPool(items) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      await processDomain(item);
      await sleep(GAP_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

await runPool(toCheck);

if (newDomains.length > 0) {
  const header = `\n# Imported from HTML ${new Date().toISOString().slice(0, 10)}\n`;
  appendFileSync(INPUT_FILE, header + newDomains.join('\n') + '\n');
}

console.log('\n── Summary ──');
console.log(`  Domains found in HTML: ${domainSource.size}`);
console.log(`  Checked for Shopify: ${toCheck.length}`);
console.log(`  New domains added: ${newDomains.length}`);
