import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";
import { api, ApiError, DEFAULT_LIBRARY_CONTENT, PROGRAMS, Session } from "../api";
import { useApi, useConnection } from "../hooks/useApi";

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

type Tab = "overview" | "sessions" | "messages" | "content" | "access";

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
              ["content", "Content"],
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

        {tab === "content" && <ContentAdmin />}

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

function ContentAdmin() {
  const { data, refetch } = useApi(() => api.content(), []);
  const content = data || DEFAULT_LIBRARY_CONTENT;
  const [notice, setNotice] = useState<{ profile?: string; staff?: string; document?: string; error?: string }>({});

  const [profileForm, setProfileForm] = useState({
    name: content.profile.name,
    title: content.profile.title,
    bio: content.profile.bio,
    image: content.profile.image,
    published: content.profile.published,
  });
  const [staffForm, setStaffForm] = useState({
    id: "",
    name: "",
    role: "",
    bio: "",
    image: "",
  });
  const [docForm, setDocForm] = useState({
    id: "",
    title: "",
    description: "",
    fileName: "",
    fileType: "",
    fileData: "",
  });

  useEffect(() => {
    if (content.profile) {
      setProfileForm({
        name: content.profile.name,
        title: content.profile.title,
        bio: content.profile.bio,
        image: content.profile.image,
        published: content.profile.published,
      });
    }
  }, [content.profile]);

  const staffList = [...(content.staff ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const documentList = [...(content.documents ?? [])].sort((a, b) => a.title.localeCompare(b.title));

  const handleFileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("File could not be read."));
      reader.readAsDataURL(file);
    });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveProfile(profileForm);
      setNotice((prev) => ({ ...prev, error: undefined, profile: profileForm.published ? "Profile published to the homepage." : "Profile saved as draft." }));
      refetch();
    } catch (err) {
      setNotice((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Profile could not be saved." }));
    }
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveStaffMember({ ...staffForm, id: staffForm.id || crypto.randomUUID() });
      setNotice((prev) => ({ ...prev, error: undefined, staff: "Staff profile saved successfully." }));
      setStaffForm({ id: "", name: "", role: "", bio: "", image: "" });
      refetch();
    } catch (err) {
      setNotice((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Staff profile could not be saved." }));
    }
  };

  const saveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.fileData || !docForm.title.trim()) return;
    try {
      await api.saveDocument({
        id: docForm.id || crypto.randomUUID(),
        title: docForm.title,
        description: docForm.description,
        fileName: docForm.fileName || docForm.title,
        fileType: docForm.fileType,
        fileData: docForm.fileData,
        createdAt: Date.now(),
      });
      setNotice((prev) => ({ ...prev, error: undefined, document: "Document uploaded and ready for public access." }));
      setDocForm({ id: "", title: "", description: "", fileName: "", fileType: "", fileData: "" });
      refetch();
    } catch (err) {
      setNotice((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Document could not be uploaded." }));
    }
  };

  const profileStatus = profileForm.published ? "Published" : "Draft";

  return (
    <div className="mt-8 space-y-8">
      {notice.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {notice.error}
        </p>
      )}
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-emerald-950">Library profile</h2>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
              profileForm.published
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {profileStatus}
          </span>
        </div>
        {notice.profile && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {notice.profile}
          </p>
        )}
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Full name
            <input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Role/title
            <input
              value={profileForm.title}
              onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Profile photo URL or data URL
            <input
              value={profileForm.image}
              onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
              placeholder="Paste image URL or data URL"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Short about text
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 md:col-span-2">
            <input
              type="checkbox"
              checked={profileForm.published}
              onChange={(e) => setProfileForm({ ...profileForm, published: e.target.checked })}
              className="h-4 w-4 accent-emerald-700"
            />
            Publish this librarian profile on the homepage
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-full bg-emerald-800 px-5 py-2 font-bold text-white">Save profile</button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-emerald-950">Staff profiles</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            {staffList.length} listed
          </span>
        </div>
        {notice.staff && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {notice.staff}
          </p>
        )}
        <form onSubmit={saveStaff} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Role
            <input
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Bio
            <textarea
              value={staffForm.bio}
              onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Profile image URL or data URL
            <input
              value={staffForm.image}
              onChange={(e) => setStaffForm({ ...staffForm, image: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-full bg-emerald-800 px-5 py-2 font-bold text-white">Add staff profile</button>
          </div>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {staffList.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm text-slate-500">
              No staff profiles yet. Add the first team member above.
            </div>
          )}
          {staffList.map((member) => (
            <div key={member.id} className="rounded-2xl border border-emerald-900/10 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white text-lg shadow-sm">
                  {member.image ? <img src={member.image} alt={member.name} className="h-full w-full object-cover" /> : "👤"}
                </div>
                <div>
                  <div className="font-extrabold text-emerald-950">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.role}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{member.bio}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStaffForm({ id: member.id, name: member.name, role: member.role, bio: member.bio, image: member.image })}
                  className="text-xs font-bold text-emerald-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => { await api.deleteStaffMember(member.id); refetch(); }}
                  className="text-xs font-bold text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-emerald-950">Library documents</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            {documentList.length} files
          </span>
        </div>
        {notice.document && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {notice.document}
          </p>
        )}
        <form onSubmit={saveDocument} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Document title
            <input
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            File
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const dataUrl = await handleFileToDataUrl(file);
                setDocForm({
                  ...docForm,
                  fileName: file.name,
                  fileType: file.type || "application/octet-stream",
                  fileData: dataUrl,
                });
              }}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
            {docForm.fileName && (
              <span className="mt-2 block text-xs font-medium text-emerald-700">Selected file: {docForm.fileName}</span>
            )}
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Short description
            <textarea
              value={docForm.description}
              onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-full bg-emerald-800 px-5 py-2 font-bold text-white">Upload and publish</button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {documentList.length === 0 && (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm text-slate-500">
              No public documents yet. Upload the first item above.
            </div>
          )}
          {documentList.map((doc) => (
            <div key={doc.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/40 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-extrabold text-emerald-950">{doc.title}</div>
                <div className="text-xs text-slate-500">{doc.fileName} · {doc.fileType}</div>
                {doc.description && <div className="mt-1 text-sm text-slate-600">{doc.description}</div>}
              </div>
              <div className="flex gap-2">
                <a href={doc.fileData} download={doc.fileName} className="text-xs font-bold text-emerald-800">Open</a>
                <button
                  type="button"
                  onClick={async () => { await api.deleteDocument(doc.id); refetch(); }}
                  className="text-xs font-bold text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
