import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

export default function RunDrawer({ open, onClose, logs, running }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Agent Run</h2>
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                running
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <CloseIcon />
          </button>
        </div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed text-zinc-300"
        >
          {logs.length === 0 ? (
            <p className="text-zinc-600">No output yet.</p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
