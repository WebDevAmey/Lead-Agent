function Stat({ label, value }) {
  return (
    <div className="flex min-w-[100px] flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-lg font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Stat label="Total Leads" value={stats.total} />
      <Stat label="Done" value={stats.done} />
      <Stat label="Not Shopify" value={stats.not_shopify} />
      <Stat label="Avg Score" value={stats.avg_score} />
      <Stat label="Emails Found" value={stats.emails_found} />
      <Stat label="Instagrams Found" value={stats.instagrams_found} />
    </div>
  );
}
