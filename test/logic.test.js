import { scoreUS, scoreSolo, finalScore } from '../lib/score.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ── Signal fixtures ──

const soloUSSignals = {
  singularCount: 18,
  pluralCount: 4,
  makerWords: 3,
  founderName: 'Sarah Lee',
  hasCofounder: false,
  hasTeamPage: false,
  currencies: { usd: true, gbp: false, eur: false },
  usAddress: true,
  usPhone: true,
  email: 'sarah@example.com',
};

const multiBrandSignals = {
  singularCount: 2,
  pluralCount: 20,
  makerWords: 0,
  founderName: 'Jake & Tom',
  hasCofounder: true,
  hasTeamPage: true,
  currencies: { usd: false, gbp: true, eur: false },
  usAddress: false,
  usPhone: false,
  email: null,
};

// ── Test A: Solo US maker ──
console.log('\nTest A — Solo US maker:');
const usA = scoreUS(soloUSSignals, 'USD');
const soloA = scoreSolo(soloUSSignals);
const scoreA = finalScore({ ...usA, solo: soloA.solo, signals: soloUSSignals, productCount: 22 });

assert(usA.isUS === true, `isUS = true (got ${usA.isUS})`);
assert(soloA.solo >= 35, `solo >= 35 (got ${soloA.solo})`);
assert(scoreA > 80, `final score > 80 (got ${scoreA})`);

// ── Test B: Multi-founder UK brand ──
console.log('\nTest B — Multi-founder UK brand:');
const usB = scoreUS(multiBrandSignals, 'GBP');
const soloB = scoreSolo(multiBrandSignals);
const scoreB = finalScore({ ...usB, solo: soloB.solo, signals: multiBrandSignals, productCount: 540 });

assert(usB.isUS === false, `isUS = false (got ${usB.isUS})`);
assert(soloB.solo <= 5, `solo <= 5 (got ${soloB.solo})`);
assert(scoreB < scoreA, `score B (${scoreB}) < score A (${scoreA})`);

// ── Test C: Pronoun regex ──
console.log('\nTest C — Pronoun regex:');
const sample = "Hi, I'm Sarah. I handcraft each piece myself. My studio is tiny but I love it.";
const lower = sample.toLowerCase();
const singular = (lower.match(/\b(i|i'm|i've|i'll|my|me|myself)\b/g) || []).length;
const plural = (lower.match(/\b(we|we're|we've|we'll|our|us|ourselves)\b/g) || []).length;

assert(singular >= 5, `singular pronouns >= 5 (got ${singular})`);
assert(plural === 0, `plural pronouns = 0 (got ${plural})`);

// ── Result ──
console.log(`\n── ${passed} passed, ${failed} failed ──\n`);
if (failed > 0) process.exit(1);