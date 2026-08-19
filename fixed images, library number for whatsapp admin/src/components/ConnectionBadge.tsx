import { useState } from "react";
import { useConnection } from "../hooks/useApi";
import { checkHealth, flushOutbox } from "../api";

const MAP = {
  online: { dot: "bg-emerald-400", label: "Backend connected", tone: "text-emerald-300" },
  offline: { dot: "bg-amber-400", label: "Offline mode", tone: "text-amber-300" },
  connecting: { dot: "bg-sky-400", label: "Connecting…", tone: "text-sky-300" },
} as const;

export function ConnectionBadge() {
  const conn = useConnection();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const m = MAP[conn.state];

  const retry = async () => {
    setBusy(true);
    await checkHealth();
    await flushOutbox();
    setBusy(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold ${m.tone} hover:bg-white/10`}
        title="Backend connection status"
      >
        <span className={`h-2 w-2 animate-pulse rounded-full ${m.dot}`} />
        {m.label}
        {conn.pending > 0 && (
          <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-emerald-950">
            {conn.pending}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-up absolute right-0 top-9 z-[80] w-72 rounded-2xl border border-emerald-900/15 bg-white p-4 text-left text-xs text-slate-600 shadow-2xl">
          <p className="font-extrabold text-emerald-900">API status</p>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between gap-3">
              <dt>State</dt>
              <dd className="font-bold text-emerald-800">{conn.state}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Endpoint</dt>
              <dd className="truncate font-mono text-[10px] text-slate-500">{conn.base}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Queued writes</dt>
              <dd className="font-bold text-emerald-800">{conn.pending}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Last check</dt>
              <dd>{conn.lastCheck ? new Date(conn.lastCheck).toLocaleTimeString() : "—"}</dd>
            </div>
          </dl>
          <p className="mt-3 leading-relaxed">
            {conn.state === "online"
              ? "All reads and writes are served by the REST API."
              : "The server is unreachable — records are stored safely on this device and will sync automatically."}
          </p>
          <button
            onClick={retry}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-emerald-800 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Retry connection & sync"}
          </button>
          <p className="mt-2 text-[10px] text-slate-400">
            Start the API with <code className="font-mono">node server/index.js</code>
          </p>
          <a href="#/admin" className="mt-3 block text-center text-[11px] font-bold text-emerald-800 underline">
            Open Librarian Admin Desk (#/admin)
          </a>
        </div>
      )}
    </div>
  );
}
