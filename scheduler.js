import { execSync } from 'node:child_process';

const INTERVAL_MS = 8 * 60 * 60 * 1000; // every 8 hours = 3x per day

async function run() {
  console.log(`[${new Date().toISOString()}] Running scheduled seed + score...`);
  try {
    execSync('node seed.js', { stdio: 'inherit' });
    execSync('node index.js', { stdio: 'inherit' });
    console.log(`[${new Date().toISOString()}] Done.`);
  } catch (e) {
    console.error('Scheduler error:', e.message);
  }
}

run(); // run immediately on start
setInterval(run, INTERVAL_MS);
