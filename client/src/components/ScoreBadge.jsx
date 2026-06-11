export default function ScoreBadge({ score }) {
  const value = Math.round(score ?? 0);
  let classes = 'bg-red-500/15 text-red-400 ring-red-500/30';
  if (value >= 70) classes = 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30';
  else if (value >= 50) classes = 'bg-amber-500/15 text-amber-400 ring-amber-500/30';

  return (
    <span
      className={`inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ${classes}`}
      title={`Score: ${value}`}
    >
      {value}
    </span>
  );
}
