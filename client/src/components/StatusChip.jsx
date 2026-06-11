const STYLES = {
  done: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  not_shopify: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  pending: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
};

const LABELS = {
  done: 'Done',
  not_shopify: 'Not Shopify',
  pending: 'Pending',
};

export default function StatusChip({ status }) {
  const key = status && STYLES[status] ? status : 'pending';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STYLES[key]}`}
    >
      {LABELS[key]}
    </span>
  );
}
