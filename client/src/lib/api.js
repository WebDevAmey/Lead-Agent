export async function fetchLeads() {
  const res = await fetch('/api/leads');
  if (!res.ok) throw new Error('Failed to load leads');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function runAgent() {
  const res = await fetch('/api/run', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to start run');
  return data;
}

export function openLogStream(onMessage) {
  const source = new EventSource('/api/logs');
  source.onmessage = e => onMessage(e.data);
  return source;
}
