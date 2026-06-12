import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { load } from 'cheerio';
import { get } from './lib/http.js';

// Bing returns zero results whenever a `-site:` exclusion is combined with
// multiple quoted phrases, so these rely on the post-fetch domain blacklist
// instead of search-side site filters.
const QUERIES = [
  '"powered by shopify" "handmade" "i make" clothing',
  '"powered by shopify" "i sew" "handmade" clothing',
  '"powered by shopify" "one woman" clothing brand',
  '"powered by shopify" "i make" "handmade" "founded by" inurl:pages/about',
  '"powered by shopify" "handmade" "i sew" clothing site:.com',
  '"powered by shopify" "one woman" clothing brand site:.com',
  '"powered by shopify" "i design" "small batch" apparel site:.com',
  `"powered by shopify" "hi i'm" "i make" jewelry site:.com`,
  '"powered by shopify" "just me" "handmade" accessories site:.com',
  '"powered by shopify" "i started" "handmade" "founded by" site:.com',
  '"powered by shopify" "meet the maker" clothing site:.com',
  '"powered by shopify" "i hand" "small business" apparel site:.com',
  '"powered by shopify" "made by me" clothing boutique site:.com',
  '"powered by shopify" "i create" "handmade" women site:.com',
  '"powered by shopify" "solopreneur" clothing site:.com',
];

const VERIFY_GAP_MS = 300;

const QUERY_GAP_MS = 3000;
const INPUT_FILE = 'input.txt';

const ALT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.4 Safari/605.1.15';

const DOMAIN_BLACKLIST = [
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'bing.com', 'microsoft.com', 'reddit.com',
];

function isBlacklisted(domain) {
  if (domain.endsWith('.myshopify.com')) return true;
  return DOMAIN_BLACKLIST.some(b => domain === b || domain.endsWith(`.${b}`));
}

// Bing wraps result links as /ck/a?...&u=a1<base64url(realUrl)>&ntb=1
function decodeBingRedirect(href) {
  try {
    const u = new URL(href, 'https://www.bing.com').searchParams.get('u');
    if (!u) return null;
    let b64 = u.startsWith('a1') ? u.slice(2) : u;
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function extractDomains(html) {
  const $ = load(html);
  const domains = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let target = null;
    if (href.includes('/ck/a?')) {
      target = decodeBingRedirect(href);
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      target = href;
    }
    if (!target) return;

    try {
      const domain = new URL(target, 'https://www.bing.com').hostname.replace(/^www\./, '').toLowerCase();
      if (domain && !isBlacklisted(domain)) domains.add(domain);
    } catch {}
  });

  return [...domains];
}

async function searchBing(query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=30`;

  let res = await get(url);
  let domains = res?.text ? extractDomains(res.text) : [];

  if (domains.length === 0) {
    console.log(`  [no results with default UA, retrying with alternate UA]`);
    res = await get(url, 3, { 'User-Agent': ALT_UA });
    domains = res?.text ? extractDomains(res.text) : [];
  }

  return domains;
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Lightweight bulk-filter check — a single attempt is enough to tell
// real Shopify stores (which always serve /products.json) apart from
// the many unrelated domains search results turn up.
async function isShopifyDomain(domain) {
  const res = await get(`https://${domain}/products.json?limit=250`, 1);
  return !!(res?.json?.products && Array.isArray(res.json.products));
}

// ── main ──
const queryFlagIndex = process.argv.indexOf('--query');
const queries = queryFlagIndex !== -1 ? [process.argv[queryFlagIndex + 1]] : QUERIES;

const existing = loadExistingDomains();
const allFound = new Set();
const newDomains = [];

for (let i = 0; i < queries.length; i++) {
  const query = queries[i];
  console.log(`\n→ Searching: ${query}`);

  const domains = await searchBing(query);
  console.log(`  found ${domains.length} domain(s)`);

  for (const domain of domains) {
    allFound.add(domain);
    if (existing.has(domain) || newDomains.includes(domain)) continue;

    const verified = await isShopifyDomain(domain);
    if (verified) {
      console.log(`  ✓ verified shopify: ${domain}`);
      newDomains.push(domain);
      existing.add(domain);
    } else {
      console.log(`  ✗ not shopify: ${domain}`);
    }
    await sleep(VERIFY_GAP_MS);
  }

  if (i < queries.length - 1) await sleep(QUERY_GAP_MS);
}

if (newDomains.length > 0) {
  const header = `\n# Seeded ${new Date().toISOString().slice(0, 10)}\n`;
  appendFileSync(INPUT_FILE, header + newDomains.join('\n') + '\n');
}

console.log('\n── Summary ──');
console.log(`  Queries run: ${queries.length}`);
console.log(`  Total domains found: ${allFound.size}`);
console.log(`  New domains added: ${newDomains.length}`);
