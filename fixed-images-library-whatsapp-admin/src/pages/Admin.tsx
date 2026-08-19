import { useMemo, useState } from "react";
import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";
import { api, ApiError, PROGRAMS, Session } from "../api";
import { useApi, useConnection } from "../hooks/useApi";

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

type Tab = "overview" | "sessions" | "messages" | "access";

export default function Admin() {
  const [authed, setAuthed] = useState(() => api.isAdmin());
  const [source, setSource] = useState<"server" | "">("");

  if (!authed) {
    return <LoginGate onOk={(s) => { setSource(s); setAuthed(true); }} />;
  }

  return <Desk source={source} onLogout={() => { api.logout(); setAuthed(false); }} />;
}

function LoginGate({ onOk }: { onOk: (s: "server") => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const conn = useConnection();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { source } = await api.login(username.trim(), password);
      onOk(source);
    } catch (ex) {
      setErr(ex instanceof ApiError || ex instanceof Error ? ex.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="LIBRARIAN ADMIN DESK"
        subtitle="Sign in to manage Top Readers, contact messages and library records."
        image={IMAGES.catalog}
      />
      <section className="mx-auto max-w-2xl px-4 py-12">
        <form onSubmit={submit} className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-extrabold text-emerald-950">Staff sign-in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Backend: <span className="font-semibold text-emerald-800">{conn.state}</span> · {conn.base}
          </p>
          <label className="mt-6 block text-sm font-semibold text-emerald-900">Username</label>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-900/15 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <label className="mt-4 block text-sm font-semibold text-emerald-900">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-emerald-900/15 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
          <button
            disabled={busy}
            className="mt-6 w-full rounded-full bg-emerald-800 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Enter admin desk"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Desk({ source, onLogout }: { source: "server"; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const overview = useApi(() => api.overview(), []);
  const sessions = useApi(() => api.sessions("all"), []);
  const messages = useApi(() => api.messages(), []);
  const o = overview.data;

  return (
    <div>
      <PageHeader
        title="LIBRARIAN ADMIN DESK"
        subtitle="Manage the Top Readers leaderboard, inbox and weekly records."
        image={IMAGES.catalog}
      />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-full border border-emerald-900/15 bg-white p-1 shadow-sm">
            {([
              ["overview", "Overview"],
              ["sessions", "Top Readers"],
              ["messages", "Inbox"],
              ["access", "Access"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  tab === k ? "bg-emerald-800 text-white" : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {source === "server" ? "Signed in via API" : "Not connected"}
            </span>
            <button
              onClick={onLogout}
              className="rounded-full border border-emerald-900/15 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>

        {tab === "overview" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["This week minutes", fmt(o?.week.minutes ?? 0)],
              ["Active readers", o?.week.readers ?? 0],
              ["All sessions", o?.sessions ?? 0],
              ["Unread messages", o?.unread ?? 0],
              ["Photos stored", o?.photos ?? 0],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
                <p className="text-3xl font-extrabold text-emerald-900">{v}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "sessions" && (
          <SessionsAdmin
            rows={sessions.data ?? []}
            onChange={() => {
              sessions.refetch();
              overview.refetch();
            }}
          />
        )}

        {tab === "messages" && (
          <MessagesAdmin
            rows={messages.data ?? []}
            onChange={() => {
              messages.refetch();
              overview.refetch();
            }}
          />
        )}

        {tab === "access" && <AccessHelp />}
      </section>
    </div>
  );
}

function SessionsAdmin({ rows, onChange }: { rows: Session[]; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Session | null>(null);
  const list = useMemo(
    () =>
      rows.filter(
        (s) =>
          !q.trim() ||
          s.reader.toLowerCase().includes(q.toLowerCase()) ||
          (s.note || "").toLowerCase().includes(q.toLowerCase())
      ),
    [rows, q]
  );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-emerald-950">Reading sessions · {rows.length}</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reader or title…"
            className="rounded-full border border-emerald-900/15 px-4 py-2 text-sm outline-none focus:border-emerald-600"
          />
          <button
            onClick={async () => {
              if (confirm("Clear this week's sessions from the leaderboard?")) {
                await api.clearScope("this");
                onChange();
              }
            }}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm"
          >
            Clear this week
          </button>
          <button
            onClick={async () => {
              if (confirm("Restore sample Top Readers data?")) {
                await api.resetAll();
                onChange();
              }
            }}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm"
          >
            Restore sample data
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-emerald-50 text-xs uppercase tracking-wide text-emerald-800">
            <tr>
              <th className="px-4 py-3">Reader</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Minutes</th>
              <th className="px-4 py-3">Books</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/10">
            {list.map((s) => (
              <tr key={s.id} className="hover:bg-emerald-50/40">
                <td className="px-4 py-3 font-semibold text-emerald-950">
                  {s.avatar} {s.reader}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.program}</td>
                <td className="px-4 py-3">{s.date}</td>
                <td className="px-4 py-3">{s.minutes}</td>
                <td className="px-4 py-3">{s.books}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">{s.note || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEdit(s)} className="mr-2 text-xs font-bold text-emerald-800">
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      await api.deleteSession(s.id);
                      onChange();
                    }}
                    className="text-xs font-bold text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No sessions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <EditSession
          session={edit}
          onClose={() => setEdit(null)}
          onSave={async (patch) => {
            await api.updateSession(edit.id, patch);
            setEdit(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function EditSession({
  session,
  onClose,
  onSave,
}: {
  session: Session;
  onClose: () => void;
  onSave: (p: Partial<Session>) => void;
}) {
  const [f, setF] = useState({
    reader: session.reader,
    program: session.program,
    minutes: session.minutes,
    books: session.books,
    date: session.date,
    note: session.note || "",
  });
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...f, minutes: Number(f.minutes), books: Number(f.books) });
        }}
      >
        <h3 className="text-lg font-extrabold text-emerald-950">Edit session</h3>
        <label className="mt-4 block text-xs font-semibold">Reader</label>
        <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.reader} onChange={(e) => setF({ ...f, reader: e.target.value })} />
        <label className="mt-3 block text-xs font-semibold">Programme</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })}>
          {PROGRAMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-semibold">Minutes</label>
            <input type="number" min={5} max={600} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.minutes} onChange={(e) => setF({ ...f, minutes: +e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold">Books</label>
            <input type="number" min={0} max={20} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.books} onChange={(e) => setF({ ...f, books: +e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold">Date</label>
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
        </div>
        <label className="mt-3 block text-xs font-semibold">Title</label>
        <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600">
            Cancel
          </button>
          <button className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white">Save</button>
        </div>
      </form>
    </div>
  );
}

function MessagesAdmin({
  rows,
  onChange,
}: {
  rows: { id?: string; name: string; email: string; topic: string; message: string; createdAt?: number; status?: string }[];
  onChange: () => void;
}) {
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-extrabold text-emerald-950">Contact inbox · {rows.length}</h2>
      {rows.map((m) => (
        <article key={m.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-extrabold text-emerald-950">{m.name}</p>
              <p className="text-xs text-slate-500">
                {m.email} · {m.topic} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-800">
              {m.status || "new"}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700">{m.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                if (m.id) await api.markMessage(m.id, "read");
                onChange();
              }}
              className="text-xs font-bold text-emerald-800"
            >
              Mark read
            </button>
            <button
              onClick={async () => {
                if (m.id) await api.deleteMessage(m.id);
                onChange();
              }}
              className="text-xs font-bold text-red-600"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
      {rows.length === 0 && <p className="rounded-2xl bg-emerald-50 p-8 text-center text-slate-500">Inbox is empty.</p>}
    </div>
  );
}

function AccessHelp() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-emerald-950">How staff open this page</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            • Address bar: add <code className="rounded bg-emerald-50 px-1.5 font-mono">#/admin</code> after the site URL
          </li>
          <li>
            • Footer link: <b>Librarian Admin</b>
          </li>
          <li>
            • Top Readers page: <b>Open Admin Desk</b>
          </li>
          <li>
            • Direct hash: <code className="rounded bg-emerald-50 px-1.5 font-mono">#/admin</code>
          </li>
        </ul>
      </div>
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-emerald-950">Top Readers API</h2>
        <p className="mt-3 text-sm text-slate-600">
          Start the backend so every logged session is stored in <code>server/data/db.json</code> and shared across devices.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-emerald-950 p-4 text-xs text-emerald-100">
{`node server/index.js
# API: http://localhost:8787
# Health: GET /api/health
# Board:  GET /api/leaderboard?scope=this
# Log:    POST /api/sessions
# Admin:  POST /api/admin/login`}
        </pre>
      </div>
    </div>
  );
}
