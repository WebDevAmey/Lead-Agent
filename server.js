import express from 'express';
import { spawn } from 'node:child_process';
import { openDB, getAllLeads } from './lib/db.js';

const PORT = 3000;

openDB();

const app = express();
app.use(express.static('client/dist'));

app.get('/api/leads', (req, res) => {
  res.json(getAllLeads());
});

app.get('/api/stats', (req, res) => {
  const leads = getAllLeads();
  const done = leads.filter(l => l.status === 'done');
  const notShopify = leads.filter(l => l.status === 'not_shopify').length;
  const avgScore = done.length
    ? done.reduce((sum, l) => sum + (l.score || 0), 0) / done.length
    : 0;

  res.json({
    total: leads.length,
    done: done.length,
    not_shopify: notShopify,
    avg_score: Math.round(avgScore * 10) / 10,
    emails_found: done.filter(l => l.email).length,
    instagrams_found: done.filter(l => l.instagram).length,
  });
});

// ── live run via SSE ──
let sseClients = [];
let runningProcess = null;

function broadcast(text) {
  const payload = text
    .split('\n')
    .map(line => `data: ${line}`)
    .join('\n');
  for (const client of sseClients) client.write(payload + '\n\n');
}

app.get('/api/logs', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('retry: 2000\n\n');

  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

app.post('/api/run', (req, res) => {
  if (runningProcess) {
    return res.status(409).json({ error: 'A run is already in progress' });
  }

  runningProcess = spawn('npm', ['start'], { cwd: process.cwd() });
  broadcast('── run started ──');

  runningProcess.stdout.on('data', d => broadcast(d.toString()));
  runningProcess.stderr.on('data', d => broadcast(d.toString()));

  runningProcess.on('close', code => {
    broadcast(`── run finished (exit ${code}) ──`);
    broadcast('__DONE__');
    runningProcess = null;
  });

  res.json({ status: 'started' });
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
