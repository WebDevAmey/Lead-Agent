export default function SoloScoreBar({ score }) {
  const value = Math.max(0, Math.min(50, score ?? 0));
  const pct = (value / 50) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-500">{value}/50</span>
    </div>
  );
}
