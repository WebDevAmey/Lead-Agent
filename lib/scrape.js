import { load } from 'cheerio';
import { get } from './http.js';

const CRAWL_PATHS = [
  '/pages/contact',
  '/contact',
  '/contact-us',
  '/pages/about',
  '/about',
  '/pages/about-us',
  '/pages/our-story',
  '/our-story',
  '/pages/meet-the-maker',
  '/policies/privacy-policy',
  '/pages/faq',
];

const CONTACT_PATHS = ['/pages/contact', '/contact', '/contact-us'];
const ABOUT_PATHS = [
  '/pages/about', '/about', '/pages/about-us', '/pages/our-story', '/our-story', '/pages/meet-the-maker',
];

const TEAM_PATHS = ['/pages/team', '/pages/our-team', '/pages/meet-the-team'];

// Spacing between same-domain requests within a single store's crawl —
// without this, the burst of ~12-15 page fetches per store triggers
// Shopify-wide 429 rate limiting that can poison concurrent rows' checks.
const PAGE_GAP_MS = 200;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const EMAIL_BLACKLIST_RE = /noreply|no-reply|@sentry|@shopify\.com|@example\.|\.(jpe?g|png|gif|svg|webp|ico)$/i;
const OBFUSCATED_EMAIL_RE =
  /([a-zA-Z0-9._%+\-]+)\s*(?:\[at\]|\(at\)|\bat\b)\s*([a-zA-Z0-9\-]+(?:\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*[a-zA-Z0-9\-]+)*)\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*([a-zA-Z]{2,})/i;
const PHONE_RE = /(?:\+?1[\s.\-]?)?\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})\b/;

function countPronouns(text) {
  const lower = text.toLowerCase();
  const singular = (lower.match(/\b(i|i'm|i've|i'll|my|me|myself)\b/g) || []).length;
  const plural = (lower.match(/\b(we|we're|we've|we'll|our|us|ourselves)\b/g) || []).length;
  return { singular, plural };
}

function countMakerWords(text) {
  const lower = text.toLowerCase();
  const words = [
    'handmade', 'hand-made', 'handcrafted', 'hand-crafted',
    'small batch', 'in my studio', 'by hand', 'just me',
    'i make', 'i create', 'i design', 'i sew', 'i knit',
    'i paint', 'i craft', 'one woman', 'one man', 'solopreneur',
  ];
  let count = 0;
  for (const w of words) if (lower.includes(w)) count++;
  return count;
}

function isValidEmail(email) {
  return !!email && EMAIL_RE.test(email) && !EMAIL_BLACKLIST_RE.test(email);
}

const TLD_BOUNDARY_RE =
  /\.(com|net|org|co|io|shop|store|info|biz|us|uk|ca|design|studio|art|me|online|life|email|world|club)(?![a-z])/;

// Trims trailing text accidentally glued onto a matched email, e.g.
// "info@brand.com.....Privacy" or "info@brand.comPhone" -> "info@brand.com"
function cleanEmailMatch(email) {
  const dotIdx = email.indexOf('..');
  if (dotIdx !== -1) email = email.slice(0, dotIdx);

  const m = email.match(TLD_BOUNDARY_RE);
  if (m) email = email.slice(0, m.index + m[0].length);

  return email;
}

function tryEmail(raw) {
  if (!raw) return null;
  const cleaned = cleanEmailMatch(raw);
  return isValidEmail(cleaned) ? cleaned : null;
}

// Visible text only — strips <script>/<style> so JS bundles and CSS
// (full of digit/word noise) don't pollute phone, pronoun, and email matching.
function getCleanText($) {
  const body = $('body').clone();
  body.find('script, style, noscript').remove();
  return body.text();
}

function extractEmailFromPage(html, $) {
  // 1. mailto links
  let found = null;
  $('a[href^="mailto:"]').each((_, el) => {
    if (found) return;
    const href = $(el).attr('href') || '';
    const raw = decodeURIComponent(href.replace(/^mailto:/i, '').split('?')[0]).trim();
    found = tryEmail(raw);
  });
  if (found) return found;

  // 2. JSON-LD email field
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const data = JSON.parse($(el).html() || '');
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        const candidates = [d.email, d.founder?.email, d.publisher?.email].filter(Boolean);
        for (const c of candidates) {
          found = tryEmail(c);
          if (found) break;
        }
      }
    } catch {}
  });
  if (found) return found;

  const text = getCleanText($);

  // 3. obfuscated email ("hello [at] brand [dot] com")
  const obf = text.match(OBFUSCATED_EMAIL_RE);
  if (obf) {
    const domain = obf[2].replace(/\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*/gi, '.');
    found = tryEmail(`${obf[1]}@${domain}.${obf[3]}`);
    if (found) return found;
  }

  // 4. visible text regex
  const textMatch = text.match(EMAIL_RE);
  return textMatch ? tryEmail(textMatch[0]) : null;
}

function extractSocialLinks($, signals) {
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (!signals.instagram && /instagram\.com/i.test(href)) signals.instagram = href;
    if (!signals.linkedin && /linkedin\.com/i.test(href)) signals.linkedin = href;
    if (!signals.facebook && /facebook\.com/i.test(href)) signals.facebook = href;
    if (!signals.tiktok && /tiktok\.com/i.test(href)) signals.tiktok = href;
  });
}

function extractPhone(text) {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  return `+1${m[1]}${m[2]}${m[3]}`;
}

function extractFounderName(text, $) {
  // 1. JSON-LD founder field
  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        if (d.founder) throw { found: d.founder?.name || d.founder };
      }
    });
  } catch (e) {
    if (e.found) return e.found;
  }

  // 2. Text patterns — ordered most-specific first
  const patterns = [
    /founded by ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+founded/,
    /started by\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /created by\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /handmade by\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /Hi,?\s+I'?m\s+([A-Z][a-z]+)/,
    /I'?m\s+([A-Z][a-z]+),?\s+the\s+founder/i,
    /My name is\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+founder\s+(?:of|and)/i,
    /by\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:founder|maker|owner|designer)/i,
    /–\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*(?:founder|owner|maker|designer)/i,
    /owner[,\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+founder\b/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1] && m[1].length > 2) return m[1];
  }
  return null;
}

function detectUSAddress(text) {
  return /[A-Z][a-z]+,\s+[A-Z]{2}\s+\d{5}/.test(text);
}

function detectUSPhone(text) {
  return /(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}/.test(text);
}

function detectCurrencies(text) {
  return {
    usd: /\$|USD/.test(text),
    gbp: /£|GBP/.test(text),
    eur: /€|EUR/.test(text),
  };
}

function detectCofounder(text) {
  return /co-?founder|cofounder/i.test(text);
}

async function fetchPage(base, paths) {
  for (const p of paths) {
    const res = await get(base + p);
    if (res?.text) return { text: res.text, url: res.url };
  }
  return null;
}

// Processes a loaded page, filling in any signals not yet set.
// Footer content is checked first since contact details there are
// the most reliably attributable to the store itself.
function processPage($, html, signals) {
  const footer = $('footer');
  if (footer.length) {
    const footerHtml = $.html(footer);
    const footer$ = load(footerHtml);
    if (!signals.email) signals.email = extractEmailFromPage(footerHtml, footer$);
    extractSocialLinks(footer$, signals);
    if (!signals.phone) signals.phone = extractPhone(getCleanText(footer$));
  }

  const text = getCleanText($);
  if (!signals.email) signals.email = extractEmailFromPage(html, $);
  extractSocialLinks($, signals);
  if (!signals.founderName) signals.founderName = extractFounderName(text, $);
  if (!signals.phone) signals.phone = extractPhone(text);

  return text;
}

export async function scrapeStore(domain) {
  const base = `https://${domain}`;
  const signals = {
    founderName: null,
    email: null,
    storeName: null,
    singularCount: 0,
    pluralCount: 0,
    makerWords: 0,
    hasCofounder: false,
    hasTeamPage: false,
    currencies: { usd: false, gbp: false, eur: false },
    usAddress: false,
    usPhone: false,
    aboutUrl: null,
    phone: null,
    instagram: null,
    linkedin: null,
    facebook: null,
    tiktok: null,
    contactFormUrl: null,
    contactUrl: null,
  };

  const visitedUrls = new Set();
  let allText = '';
  let contactPage = null;
  let privacyPage = null;

  const trackCurrency = (rawText) => {
    const cur = detectCurrencies(rawText);
    if (cur.usd) signals.currencies.usd = true;
    if (cur.gbp) signals.currencies.gbp = true;
    if (cur.eur) signals.currencies.eur = true;
  };

  // Homepage
  const home = await get(base);
  if (home?.text) {
    visitedUrls.add(home.url);
    const $ = load(home.text);
    signals.storeName =
      $('meta[property="og:site_name"]').attr('content') ||
      $('title').text().trim().split('|')[0].trim() ||
      null;
    allText += processPage($, home.text, signals) + ' ';
    if (!signals.contactFormUrl && $('form').length > 0) signals.contactFormUrl = home.url;
    trackCurrency(home.text);
  }

  // Crawl contact / about / policy pages (skip 404s, dedupe by resolved URL)
  for (const path of CRAWL_PATHS) {
    await sleep(PAGE_GAP_MS);
    const res = await get(base + path);
    if (!res?.text || visitedUrls.has(res.url)) continue;
    visitedUrls.add(res.url);

    const $ = load(res.text);
    allText += processPage($, res.text, signals) + ' ';

    if (!signals.contactFormUrl && $('form').length > 0) signals.contactFormUrl = res.url;
    if (!signals.contactUrl && CONTACT_PATHS.includes(path)) {
      signals.contactUrl = res.url;
      contactPage = { html: res.text, $ };
    }
    if (!signals.aboutUrl && ABOUT_PATHS.includes(path)) signals.aboutUrl = res.url;
    if (path === '/policies/privacy-policy') privacyPage = { html: res.text, $ };

    trackCurrency(res.text);
  }

  // Team pages
  await sleep(PAGE_GAP_MS);
  const team = await fetchPage(base, TEAM_PATHS);
  if (team) {
    signals.hasTeamPage = true;
    const $ = load(team.text);
    allText += getCleanText($) + ' ';
  }

  // Second-pass email recovery from contact / privacy pages
  if (!signals.email && contactPage) {
    signals.email = extractEmailFromPage(contactPage.html, contactPage.$);
  }
  if (!signals.email && privacyPage) {
    signals.email = extractEmailFromPage(privacyPage.html, privacyPage.$);
  }

  // Aggregate all text
  const { singular, plural } = countPronouns(allText);
  signals.singularCount = singular;
  signals.pluralCount = plural;
  signals.makerWords = countMakerWords(allText);
  signals.hasCofounder = detectCofounder(allText);
  signals.usAddress = detectUSAddress(allText);
  signals.usPhone = detectUSPhone(allText);

  return signals;
}
