import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import LeadCard from './components/LeadCard';
import RunDrawer from './components/RunDrawer';
import { PlayIcon } from './components/Icons';
import { fetchLeads, fetchStats, runAgent, openLogStream } from './lib/api';

const DEFAULT_FILTERS = {
  search: '',
  minScore: '',
  maxScore: '',
  hasEmail: false,
  hasInstagram: false,
  isUs: false,
};

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [leadsData, statsData] = await Promise.all([fetchLeads(), fetchStats()]);
      setLeads(leadsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const handleRun = async () => {
    setLogs([]);
    setDrawerOpen(true);

    if (!eventSourceRef.current) {
      eventSourceRef.current = openLogStream(line => {
        if (line === '__DONE__') {
          setRunning(false);
          loadData();
          return;
        }
        setLogs(prev => [...prev, line]);
      });
    }

    try {
      setRunning(true);
      await runAgent();
    } catch (err) {
      setRunning(false);
      setLogs(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  const filteredLeads = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const min = filters.minScore === '' ? -Infinity : Number(filters.minScore);
    const max = filters.maxScore === '' ? Infinity : Number(filters.maxScore);

    return leads.filter(lead => {
      if (search) {
        const haystack = `${lead.store_name || ''} ${lead.domain || ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      const score = lead.score ?? 0;
      if (score < min || score > max) return false;
      if (filters.hasEmail && !lead.email) return false;
      if (filters.hasInstagram && !lead.instagram) return false;
      if (filters.isUs && !lead.is_us) return false;
      return true;
    });
  }, [leads, filters]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-zinc-100">Lead Dashboard</h1>
          <button
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayIcon />
            {running ? 'Running…' : 'Run Agent'}
          </button>
        </div>

        <StatsBar stats={stats} />
        <FilterBar filters={filters} onChange={setFilters} />
      </header>

      <main className="flex flex-col gap-3">
        {loading && <p className="text-sm text-zinc-500">Loading leads…</p>}
        {error && <p className="text-sm text-red-400">Error: {error}</p>}
        {!loading && !error && filteredLeads.length === 0 && (
          <p className="text-sm text-zinc-500">No leads match these filters.</p>
        )}
        {filteredLeads.map(lead => (
          <LeadCard key={lead.input || lead.domain} lead={lead} />
        ))}
      </main>

      <RunDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        logs={logs}
        running={running}
      />
    </div>
  );
}
