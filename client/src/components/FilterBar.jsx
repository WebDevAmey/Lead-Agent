import { SearchIcon } from './Icons';

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
        checked
          ? 'bg-violet-500/15 text-violet-300 ring-violet-500/40'
          : 'bg-zinc-900/60 text-zinc-400 ring-zinc-800 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterBar({ filters, onChange }) {
  const set = patch => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
          placeholder="Search store or domain..."
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Score</span>
        <input
          type="number"
          min="0"
          max="100"
          value={filters.minScore}
          onChange={e => set({ minScore: e.target.value })}
          placeholder="min"
          className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />
        <span className="text-xs text-zinc-500">–</span>
        <input
          type="number"
          min="0"
          max="100"
          value={filters.maxScore}
          onChange={e => set({ maxScore: e.target.value })}
          placeholder="max"
          className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle
          label="Has Email"
          checked={filters.hasEmail}
          onChange={v => set({ hasEmail: v })}
        />
        <Toggle
          label="Has Instagram"
          checked={filters.hasInstagram}
          onChange={v => set({ hasInstagram: v })}
        />
        <Toggle
          label="US Only"
          checked={filters.isUs}
          onChange={v => set({ isUs: v })}
        />
      </div>
    </div>
  );
}
