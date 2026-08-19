import { useMemo, useState } from "react";
import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";
import { useApi, useConnection } from "../hooks/useApi";
import {
  ApiError,
  AVATARS,
  PROGRAMS,
  Scope,
  api,
  iso,
  prettyRange,
  toCSV,
} from "../api";

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

export default function TopReaders() {
  const [scope, setScope] = useState<Scope>("this");
  const [filter, setFilter] = useState("All programmes");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "warn" | "err" } | null>(null);

  const conn = useConnection();

  const board = useApi(() => api.leaderboard(scope, filter, query), [scope, filter, query]);
  const stats = useApi(() => api.stats(scope), [scope]);
  const recent = useApi(() => api.sessions(scope, 8), [scope]);

  const rows = board.data ?? [];
  const podium = rows.slice(0, 3);
  const goal = stats.data?.goalMinutes ?? 600;
  const chart = stats.data?.daily ?? [];
  const maxMin = Math.max(1, ...chart.map((c) => c.minutes));

  const flash = (msg: string, tone: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3200);
  };

  const refreshAll = () => {
    board.refetch();
    stats.refetch();
    recent.refetch();
  };

  const download = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cnms-top-readers-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash("Leaderboard exported as CSV");
  };

  const scopeLabel = useMemo(
    () => ({ this: prettyRange(0), last: prettyRange(-1), all: "All records" }[scope]),
    [scope]
  );

  return (
    <div>
      <PageHeader
        title="TOP READERS OF THE WEEK"
        subtitle="Live reading leaderboard powered by the CNMS Library API — log sessions, earn points and badges, and track the week's leaders."
        image={IMAGES.reading}
      />

      {toast && (
        <div
          className={`fade-up fixed bottom-24 right-6 z-[70] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-2xl ${
            toast.tone === "ok"
              ? "bg-emerald-800"
              : toast.tone === "warn"
              ? "bg-amber-600"
              : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10">
        {/* Connection banner */}
        {conn.state === "offline" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <span>
              ⚠️ <b>Offline mode.</b> The API at{" "}
              <code className="font-mono text-xs">{conn.base}</code> is unreachable. Records are
              saved on this device
              {conn.pending > 0 && ` (${conn.pending} waiting to sync)`} and will upload
              automatically.
            </span>
            <button
              onClick={refreshAll}
              className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
            >
              Retry now
            </button>
          </div>
        )}
        {board.error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
            {board.error}{" "}
            <button onClick={refreshAll} className="font-bold underline">
              Try again
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-full border border-emerald-900/15 bg-white p-1 shadow-sm">
            {(
              [
                ["this", `This week · ${prettyRange(0)}`],
                ["last", `Last week · ${prettyRange(-1)}`],
                ["all", "All time"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setScope(k)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
                  scope === k ? "bg-emerald-800 text-white" : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Find a reader…"
              className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option>All programmes</option>
              {PROGRAMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={refreshAll}
              className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
            >
              ⟳ Refresh
            </button>
            <button
              onClick={download}
              className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Reading time logged", v: fmt(stats.data?.minutes ?? 0), i: "⏱️" },
            { l: "Active readers", v: stats.data?.readers ?? 0, i: "🧑🏾‍🎓" },
            { l: "Books completed", v: stats.data?.books ?? 0, i: "📗" },
            { l: "Sessions recorded", v: stats.data?.sessions ?? 0, i: "🗒️" },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm">
              <p className="text-2xl">{c.i}</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-900">
                {stats.loading ? <span className="text-slate-300">···</span> : c.v}
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500">{c.l}</p>
            </div>
          ))}
        </div>

        {/* Podium */}
        {podium.length > 0 && (
          <div className="mt-10 grid items-end gap-4 sm:grid-cols-3">
            {[1, 0, 2].map((idx, pos) => {
              const r = podium[idx];
              if (!r) return <div key={pos} />;
              const heights = ["h-40", "h-52", "h-36"];
              const medals = ["🥈", "🥇", "🥉"];
              return (
                <div
                  key={r.reader}
                  className={`flex ${heights[pos]} flex-col items-center justify-end rounded-3xl bg-gradient-to-b ${
                    idx === 0
                      ? "from-amber-300 to-amber-500 text-emerald-950"
                      : "from-emerald-700 to-emerald-900 text-white"
                  } p-5 text-center shadow-xl`}
                >
                  <span className="text-4xl">{r.avatar}</span>
                  <span className="mt-1 text-2xl">{medals[pos]}</span>
                  <p className="mt-1 text-sm font-extrabold">{r.reader}</p>
                  <p className="text-xs opacity-80">
                    {fmt(r.minutes)} · {r.points} pts
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Leaderboard */}
          <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 bg-emerald-50 px-6 py-4">
              <h2 className="font-extrabold text-emerald-950">🏆 Leaderboard · {scopeLabel}</h2>
              <span className="text-xs font-semibold text-slate-500">
                Points = minutes + 45 per completed book
              </span>
            </div>

            {board.loading && rows.length === 0 ? (
              <div className="divide-y divide-emerald-900/10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-5">
                    <div className="h-9 w-9 rounded-full bg-emerald-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-emerald-100" />
                      <div className="h-2 w-1/4 rounded bg-emerald-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-emerald-900/10">
                {rows.map((r, i) => {
                  const pct = Math.min(100, Math.round((r.minutes / goal) * 100));
                  return (
                    <div key={r.reader} className="px-6 py-4 transition hover:bg-emerald-50/50">
                      <div className="flex items-center gap-4">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                            i === 0
                              ? "bg-amber-400 text-emerald-950"
                              : i < 3
                              ? "bg-emerald-800 text-white"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-3xl">{r.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-extrabold text-emerald-950">{r.reader}</p>
                          <p className="truncate text-xs text-slate-500">{r.program}</p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-400 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {r.badges.map((b) => (
                              <span
                                key={b}
                                className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-lg font-extrabold text-emerald-800">{r.points}</p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">points</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-900">{fmt(r.minutes)}</p>
                          <p className="text-[11px] text-slate-500">
                            {r.books} 📗 · {r.days}d
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {rows.length === 0 && (
                  <p className="p-10 text-center text-slate-500">
                    No reading sessions recorded for this period yet. Be the first to log one!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <LogForm onResult={flash} />

            {/* Chart */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-lg">
              <h3 className="font-extrabold text-emerald-950">📊 Daily reading minutes</h3>
              <div className="mt-6 flex h-40 items-end gap-2">
                {chart.map((c) => (
                  <div key={c.date} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100">
                      {c.minutes}m
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-800 to-emerald-500 transition-all duration-700"
                      style={{ height: `${Math.max(4, (c.minutes / maxMin) * 100)}%` }}
                    />
                    <span className="text-[10px] font-semibold text-slate-500">{c.label}</span>
                  </div>
                ))}
                {chart.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
              </div>
            </div>

            {/* Activity feed */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-lg">
              <h3 className="font-extrabold text-emerald-950">🕘 Recent activity</h3>
              <ul className="mt-4 space-y-3">
                {(recent.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-start gap-3 text-sm">
                    <span className="text-xl">{s.avatar}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-900">
                        {s.reader}{" "}
                        <span className="font-normal text-slate-500">
                          read {fmt(s.minutes)}
                          {s.books ? ` · finished ${s.books} book` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.note ? `“${s.note}” · ` : ""}
                        {s.date}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-300">{s.date}</span>
                  </li>
                ))}
                {(recent.data ?? []).length === 0 && (
                  <li className="text-sm text-slate-500">Nothing logged yet.</li>
                )}
              </ul>
            </div>

            <div className="rounded-3xl border border-dashed border-emerald-900/20 bg-emerald-50/60 p-6">
              <h3 className="font-extrabold text-emerald-950">🔐 Librarian Admin Desk</h3>
              <p className="mt-1 text-xs text-slate-600">
                Edit or delete sessions, clear a week, restore sample data and read the contact inbox.
                Open <code className="font-mono">#/admin</code> and sign in with your librarian credentials.
              </p>
              <a
                href="#/admin"
                className="mt-4 inline-block rounded-full bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Open Admin Desk →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* --------------------------- log form --------------------------- */

function LogForm({ onResult }: { onResult: (m: string, t?: "ok" | "warn" | "err") => void }) {
  const [f, setF] = useState({
    reader: "",
    program: PROGRAMS[0],
    avatar: AVATARS[0],
    minutes: 60,
    books: 0,
    date: iso(new Date()),
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (f.reader.trim().length < 3) local.reader = "Enter your full name (3+ characters).";
    if (f.minutes < 5) local.minutes = "Minimum session is 5 minutes.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const { synced } = await api.createSession({ ...f, reader: f.reader.trim() });
      onResult(
        synced
          ? `Saved to the server — ${f.minutes} minutes for ${f.reader.trim()} 🎉`
          : `Saved offline — will sync when the API is back ⏳`,
        synced ? "ok" : "warn"
      );
      setF({ ...f, minutes: 60, books: 0, note: "" });
      setErrors({});
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      onResult(err instanceof Error ? err.message : "Could not save session.", "err");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";
  const Err = ({ k }: { k: string }) =>
    errors[k] ? <p className="mt-1 text-xs font-semibold text-amber-300">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} className="rounded-3xl bg-emerald-900 p-6 text-white shadow-xl">
      <h3 className="text-lg font-extrabold">✍️ Log a reading session</h3>
      <p className="mt-1 text-xs text-emerald-200">
        Posted to <code className="font-mono">POST /api/sessions</code> — validated on the server.
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <input
            className={input}
            placeholder="Full name"
            value={f.reader}
            onChange={(e) => setF({ ...f, reader: e.target.value })}
          />
          <Err k="reader" />
        </div>

        <select
          className={input}
          value={f.program}
          onChange={(e) => setF({ ...f, program: e.target.value })}
        >
          {PROGRAMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setF({ ...f, avatar: a })}
              className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                f.avatar === a ? "bg-amber-400" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-emerald-200">
            Minutes read: <span className="text-amber-300">{f.minutes}</span>
          </label>
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={f.minutes}
            onChange={(e) => setF({ ...f, minutes: +e.target.value })}
            className="w-full accent-amber-400"
          />
          <Err k="minutes" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-emerald-200">Books finished</label>
            <input
              type="number"
              min={0}
              max={10}
              className={input}
              value={f.books}
              onChange={(e) => setF({ ...f, books: +e.target.value })}
            />
            <Err k="books" />
          </div>
          <div>
            <label className="text-xs font-semibold text-emerald-200">Date</label>
            <input
              type="date"
              max={iso(new Date())}
              className={input}
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
            <Err k="date" />
          </div>
        </div>

        <input
          className={input}
          placeholder="Title read (optional)"
          value={f.note}
          onChange={(e) => setF({ ...f, note: e.target.value })}
        />

        <button
          disabled={busy}
          className="w-full rounded-full bg-amber-400 py-3 font-bold text-emerald-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Record my reading"}
        </button>
      </div>
    </form>
  );
}
