/**
 * Local persistence adapter — mirrors the backend API exactly.
 * Used as an automatic fallback when the server is unreachable so the
 * application never loses data or breaks.
 */
import {
  ContactMessage,
  LibraryContent,
  LibraryDocument,
  LibraryProfile,
  NewSession,
  Row,
  Scope,
  Session,
  StaffProfile,
  Stats,
  WEEKLY_GOAL_MINUTES,
  PROGRAMS,
} from "./types";

const KEY = "cnms-db-v2";
const OUTBOX = "cnms-outbox-v1";
const PHOTOS = "cnms-photos-v1";
const CONTENT_KEY = "cnms-content-v1";

export type Photo = {
  id: string;
  data: string;
  caption: string;
  type: "group" | "photo";
  uploadedAt: number;
};

type LocalDB = { sessions: Session[]; messages: ContactMessage[]; content: LibraryContent };

export const DEFAULT_LIBRARY_CONTENT: LibraryContent = {
  profile: {
    name: "Mrs. Akua Boadu",
    title: "College Librarian",
    bio:
      "A dedicated information professional supporting teaching, learning and evidence-based nursing practice across the College.",
    image: "",
    published: false,
  },
  staff: [
    {
      id: "staff-1",
      name: "Mrs. Akua Boadu",
      role: "College Librarian",
      bio: "Leads library services, research support and user education.",
      image: "",
    },
    {
      id: "staff-2",
      name: "Mr. Kofi Mensah",
      role: "Senior Library Assistant",
      bio: "Handles acquisitions, cataloguing and collection growth.",
      image: "",
    },
    {
      id: "staff-3",
      name: "Miss Efua Owusu",
      role: "E-Resource Officer",
      bio: "Manages electronic resources and digital access support.",
      image: "",
    },
  ],
  documents: [],
};

export const iso = (d: Date | string | number) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function weekBounds(offset = 0) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function prettyRange(offset = 0) {
  const { start, end } = weekBounds(offset);
  const f = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(start)} – ${f(end)}`;
}

export const pointsOf = (minutes: number, books: number) => Math.round(minutes + books * 45);

function read(): LocalDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDB;
      return {
        sessions: parsed.sessions || [],
        messages: parsed.messages || [],
        content: normalizeContent(parsed.content || DEFAULT_LIBRARY_CONTENT),
      };
    }
  } catch {
    /* corrupted store — reseed */
  }
  const fresh = { sessions: seed(), messages: [], content: { ...DEFAULT_LIBRARY_CONTENT, staff: [...DEFAULT_LIBRARY_CONTENT.staff], documents: [] } };
  write(fresh);
  return fresh;
}

function normalizeContent(content?: Partial<LibraryContent>): LibraryContent {
  const safe = content || {};
  return {
    profile: {
      name: safe.profile?.name || DEFAULT_LIBRARY_CONTENT.profile.name,
      title: safe.profile?.title || DEFAULT_LIBRARY_CONTENT.profile.title,
      bio: safe.profile?.bio || DEFAULT_LIBRARY_CONTENT.profile.bio,
      image: safe.profile?.image || DEFAULT_LIBRARY_CONTENT.profile.image,
      published: Boolean(safe.profile?.published),
    },
    staff: Array.isArray(safe.staff)
      ? safe.staff.map((member, idx) => ({
          id: member.id || `staff-${idx + 1}`,
          name: member.name || `Staff ${idx + 1}`,
          role: member.role || "Library Staff",
          bio: member.bio || "",
          image: member.image || "",
        }))
      : [...DEFAULT_LIBRARY_CONTENT.staff],
    documents: Array.isArray(safe.documents)
      ? safe.documents
          .map((doc) => ({
            id: doc.id || crypto.randomUUID(),
            title: doc.title || "Untitled document",
            description: doc.description || ""
            ,
            fileName: doc.fileName || "document",
            fileType: doc.fileType || "application/octet-stream",
            fileData: doc.fileData || "",
            createdAt: doc.createdAt || Date.now(),
          }))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [],
  };
}

function write(db: LocalDB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    localStorage.setItem(CONTENT_KEY, JSON.stringify(db.content));
  } catch {
    /* quota exceeded — ignore */
  }
}

/* --------------------------- reads --------------------------- */

export function scopedSessions(scope: Scope, db = read()): Session[] {
  if (scope === "all") return db.sessions;
  const { start, end } = weekBounds(scope === "last" ? -1 : 0);
  return db.sessions.filter((s) => {
    const d = new Date(`${s.date}T12:00:00`);
    return d >= start && d <= end;
  });
}

function streakFor(reader: string, all: Session[]) {
  const days = new Set(all.filter((s) => s.reader === reader).map((s) => s.date));
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  if (!days.has(iso(cur))) cur.setDate(cur.getDate() - 1);
  while (days.has(iso(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export function listSessions(scope: Scope, limit = 0): Session[] {
  const list = [...scopedSessions(scope)].sort((a, b) => b.createdAt - a.createdAt);
  return limit > 0 ? list.slice(0, limit) : list;
}

export function leaderboard(scope: Scope, program?: string, q?: string): Row[] {
  const db = read();
  const scoped = scopedSessions(scope, db);
  const map = new Map<string, Row>();

  for (const s of scoped) {
    const r =
      map.get(s.reader) ??
      ({
        reader: s.reader,
        program: s.program,
        avatar: s.avatar,
        minutes: 0,
        books: 0,
        sessions: 0,
        days: 0,
        points: 0,
        streak: 0,
        badges: [],
      } as Row);
    r.minutes += s.minutes;
    r.books += s.books;
    r.sessions += 1;
    r.program = s.program || r.program;
    r.avatar = s.avatar || r.avatar;
    map.set(s.reader, r);
  }

  for (const [name, r] of map) {
    r.days = new Set(scoped.filter((s) => s.reader === name).map((s) => s.date)).size;
    r.points = pointsOf(r.minutes, r.books);
    r.streak = streakFor(name, db.sessions);
    r.badges = [];
    if (r.minutes >= WEEKLY_GOAL_MINUTES) r.badges.push("🎯 Goal Crusher");
    if (r.books >= 5) r.badges.push("📚 Bookworm");
    if (r.days >= 5) r.badges.push("🔥 Consistent");
    if (r.streak >= 3) r.badges.push(`⚡ ${r.streak}-day streak`);
    if (r.sessions >= 8) r.badges.push("🏛️ Library Regular");
  }

  let rows = [...map.values()].sort((a, b) => b.points - a.points || b.minutes - a.minutes);
  if (program && program !== "All programmes") rows = rows.filter((r) => r.program === program);
  if (q?.trim()) rows = rows.filter((r) => r.reader.toLowerCase().includes(q.trim().toLowerCase()));
  return rows;
}

export function stats(scope: Scope): Stats {
  const scoped = scopedSessions(scope);
  const { start } = weekBounds(scope === "last" ? -1 : 0);
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = iso(d);
    return {
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: scoped.filter((s) => s.date === key).reduce((a, s) => a + s.minutes, 0),
    };
  });
  return {
    scope,
    minutes: scoped.reduce((a, s) => a + s.minutes, 0),
    books: scoped.reduce((a, s) => a + s.books, 0),
    readers: new Set(scoped.map((s) => s.reader)).size,
    sessions: scoped.length,
    daily,
    weekStart: iso(start),
    goalMinutes: WEEKLY_GOAL_MINUTES,
  };
}

/* --------------------------- writes --------------------------- */

export function createSession(input: NewSession): Session {
  const db = read();
  const session: Session = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: Date.now(),
  };
  if (!db.sessions.some((s) => s.id === session.id)) db.sessions.push(session);
  write(db);
  return session;
}

export function deleteSession(id: string) {
  const db = read();
  db.sessions = db.sessions.filter((s) => s.id !== id);
  write(db);
}

export function clearScope(scope: Scope) {
  const db = read();
  const target = new Set(scopedSessions(scope, db).map((s) => s.id));
  db.sessions = db.sessions.filter((s) => !target.has(s.id));
  write(db);
}

export function resetAll() {
  write({ sessions: seed(), messages: [] });
}

export function saveMessage(m: ContactMessage) {
  const db = read();
  db.messages.push({ ...m, id: m.id ?? crypto.randomUUID() });
  write(db);
}

export function listMessages(): ContactMessage[] {
  return [...read().messages].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function updateSession(id: string, patch: Partial<Session>): Session | null {
  const db = read();
  const found = db.sessions.find((s) => s.id === id);
  if (!found) return null;
  Object.assign(found, patch, { id: found.id, createdAt: found.createdAt });
  write(db);
  return found;
}

export function updateMessageStatus(id: string, status: ContactMessage["status"]) {
  const db = read();
  const found = db.messages.find((m) => m.id === id);
  if (found) {
    found.status = status;
    write(db);
  }
}

export function deleteMessage(id: string) {
  const db = read();
  db.messages = db.messages.filter((m) => m.id !== id);
  write(db);
}

export function listContent(): LibraryContent {
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    const parsed = raw ? JSON.parse(raw) : read().content;
    return normalizeContent(parsed);
  } catch {
    return { ...DEFAULT_LIBRARY_CONTENT, staff: [...DEFAULT_LIBRARY_CONTENT.staff], documents: [] };
  }
}

export function saveContent(content: LibraryContent) {
  const db = read();
  db.content = normalizeContent(content);
  write(db);
  return db.content;
}

export function saveProfile(profile: LibraryProfile) {
  const db = read();
  db.content.profile = { ...profile, published: Boolean(profile.published) };
  write(db);
  return db.content.profile;
}

export function saveStaffMember(member: StaffProfile) {
  const db = read();
  const next = db.content.staff.filter((m) => m.id !== member.id);
  next.push({ ...member, id: member.id || crypto.randomUUID() });
  db.content.staff = next.sort((a, b) => a.name.localeCompare(b.name));
  write(db);
  return db.content.staff;
}

export function deleteStaffMember(id: string) {
  const db = read();
  db.content.staff = db.content.staff.filter((m) => m.id !== id);
  write(db);
  return db.content.staff;
}

export function saveDocument(doc: LibraryDocument) {
  const db = read();
  const next = db.content.documents.filter((d) => d.id !== doc.id);
  next.push({ ...doc, id: doc.id || crypto.randomUUID() });
  db.content.documents = next.sort((a, b) => a.title.localeCompare(b.title));
  write(db);
  return db.content.documents;
}

export function deleteDocument(id: string) {
  const db = read();
  db.content.documents = db.content.documents.filter((d) => d.id !== id);
  write(db);
  return db.content.documents;
}

/* ----------------------------- photos ----------------------------- */

export function listPhotos(): Photo[] {
  try {
    const list = JSON.parse(localStorage.getItem(PHOTOS) || "[]") as (Photo & { type?: string })[];
    return list.map((p) => ({ ...p, type: p.type === "group" ? "group" : "photo" }));
  } catch {
    return [];
  }
}

export function savePhoto(p: Photo) {
  const list = listPhotos().filter((x) => x.id !== p.id);
  list.push(p);
  try {
    localStorage.setItem(PHOTOS, JSON.stringify(list));
  } catch {
    /* quota exceeded — drop oldest photo that does not fit */
    while (list.length > 1) {
      list.pop();
      try {
        localStorage.setItem(PHOTOS, JSON.stringify(list));
        break;
      } catch {
        /* keep shrinking */
      }
    }
  }
}

export function deletePhoto(id: string) {
  localStorage.setItem(PHOTOS, JSON.stringify(listPhotos().filter((x) => x.id !== id)));
}

/* ------------------------- offline outbox ------------------------- */

export type OutboxItem =
  | { kind: "session"; payload: NewSession & { id: string } }
  | { kind: "message"; payload: ContactMessage & { id: string } }
  | { kind: "photo"; payload: Photo };

export function outbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) || "[]");
  } catch {
    return [];
  }
}

export function enqueue(item: OutboxItem) {
  const list = outbox();
  if (!list.some((i) => i.payload.id === item.payload.id)) list.push(item);
  localStorage.setItem(OUTBOX, JSON.stringify(list));
}

export function setOutbox(list: OutboxItem[]) {
  localStorage.setItem(OUTBOX, JSON.stringify(list));
}

/* ---------------------------- seed ---------------------------- */

function seed(): Session[] {
  const NAMES: [string, string, string][] = [
    ["Akua Mensah", PROGRAMS[0], "👩🏾‍⚕️"],
    ["Kwabena Owusu", PROGRAMS[2], "🧑🏾‍⚕️"],
    ["Abena Serwaa", PROGRAMS[1], "👩🏾‍🎓"],
    ["Yaw Boateng", PROGRAMS[0], "👨🏾‍🎓"],
    ["Efua Danquah", PROGRAMS[1], "👩🏾‍🏫"],
    ["Kojo Ampofo", PROGRAMS[3], "🧑🏾‍🎓"],
    ["Adwoa Nyarko", PROGRAMS[0], "👩🏾‍⚕️"],
    ["Kofi Asante", PROGRAMS[4], "🧑🏾‍💻"],
  ];
  const TITLES = [
    "Fundamentals of Nursing",
    "Myles Textbook for Midwives",
    "Medical–Surgical Nursing",
    "Anatomy & Physiology",
    "Community Health Nursing",
    "Pharmacology for Nurses",
  ];
  let n = 7;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280), n / 233280);
  const out: Session[] = [];
  for (const w of [0, -1]) {
    const { start } = weekBounds(w);
    for (const [reader, program, avatar] of NAMES) {
      const count = 2 + Math.floor(rnd() * 5);
      for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + Math.floor(rnd() * 7));
        if (d > new Date()) continue;
        out.push({
          id: crypto.randomUUID(),
          reader,
          program,
          avatar,
          minutes: 35 + Math.floor(rnd() * 130),
          books: rnd() > 0.55 ? 1 : 0,
          date: iso(d),
          note: TITLES[Math.floor(rnd() * TITLES.length)],
          createdAt: d.getTime(),
        });
      }
    }
  }
  return out;
}

export function toCSV(rows: Row[]) {
  const head = "Rank,Reader,Programme,Minutes,Books,Sessions,Active Days,Points";
  const body = rows
    .map((r, i) =>
      [i + 1, `"${r.reader}"`, `"${r.program}"`, r.minutes, r.books, r.sessions, r.days, r.points].join(",")
    )
    .join("\n");
  return `${head}\n${body}`;
}
