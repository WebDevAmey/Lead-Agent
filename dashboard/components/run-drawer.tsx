"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface RunDrawerProps {
  open: boolean;
  onClose: () => void;
  logs: string[];
  running: boolean;
}

export function RunDrawer({ open, onClose, logs, running }: RunDrawerProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Agent Run</h2>
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                running
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
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
