/**
 * CNMS-LIBRARY BACKEND
 * --------------------------------------------------------------
 * Zero-dependency Node.js REST API (http + fs) with JSON file
 * persistence, atomic writes, validation, CORS, request logging,
 * rate limiting, graceful shutdown and health checks.
 *
 *   node server/index.js            # starts on http://localhost:8787
 *   PORT=9000 node server/index.js  # custom port
 * --------------------------------------------------------------
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const ADMIN_USER = process.env.ADMIN_USER || "librarian";
const ADMIN_PASS = process.env.ADMIN_PASS || "cnms2026";
const adminTokens = new Map();
const loginHits = new Map();
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const STARTED_AT = Date.now();

/* ------------------------------------------------------------------ */
/*  Storage layer — atomic JSON persistence with in-memory cache       */
/* ------------------------------------------------------------------ */

const EMPTY_DB = {
  sessions: [],
  messages: [],
  announcements: [],
  photos: [],
  content: {
    profile: {
      name: "Mrs. Akua Boadu",
      title: "College Librarian",
      bio: "A dedicated information professional supporting teaching, learning and evidence-based nursing practice across the College.",
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
  },
  version: 1,
};
let db = null;
let writeQueue = Promise.resolve();

function normalizeContentPayload(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const staff = Array.isArray(base.staff) ? base.staff : EMPTY_DB.content.staff;
  const documents = Array.isArray(base.documents) ? base.documents : [];
  return {
    profile: {
      name: String(base.profile?.name || EMPTY_DB.content.profile.name).slice(0, 120),
      title: String(base.profile?.title || EMPTY_DB.content.profile.title).slice(0, 120),
      bio: String(base.profile?.bio || EMPTY_DB.content.profile.bio).slice(0, 700),
      image: String(base.profile?.image || EMPTY_DB.content.profile.image),
      published: Boolean(base.profile?.published),
    },
    staff: staff.map((person, index) => ({
      id: String(person?.id || `staff-${index + 1}`),
      name: String(person?.name || "Library Staff").slice(0, 120),
      role: String(person?.role || "Library Staff").slice(0, 120),
      bio: String(person?.bio || "").slice(0, 500),
      image: String(person?.image || ""),
    })).sort((a, b) => a.name.localeCompare(b.name)),
    documents: documents
      .map((doc) => ({
        id: String(doc?.id || crypto.randomUUID()),
        title: String(doc?.title || "Untitled document").slice(0, 200),
        description: String(doc?.description || "").slice(0, 500),
        fileName: String(doc?.fileName || "document").slice(0, 200),
        fileType: String(doc?.fileType || "application/octet-stream").slice(0, 120),
        fileData: String(doc?.fileData || ""),
        createdAt: Number(doc?.createdAt || Date.now()),
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  };
}

function ensureDB(raw) {
  const next = { ...EMPTY_DB, ...(raw || {}) };
  next.sessions = Array.isArray(next.sessions) ? next.sessions : [];
  next.messages = Array.isArray(next.messages) ? next.messages : [];
  next.announcements = Array.isArray(next.announcements) ? next.announcements : [];
  next.photos = Array.isArray(next.photos) ? next.photos : [];
  next.content = normalizeContentPayload(next.content);
  return next;
}

function loadDB() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      db = ensureDB(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
    } else {
      db = seedDB();
      persist();
    }
  } catch (err) {
    console.error("[db] load failed, starting fresh:", err.message);
    db = seedDB();
  }
  console.log(`[db] ready — ${db.sessions.length} sessions, ${db.messages.length} messages`);
}

/** Atomic write: temp file + rename so the DB can never be half-written. */
function persist() {
  writeQueue = writeQueue.then(
    () =>
      new Promise((resolve) => {
        const tmp = `${DB_FILE}.${process.pid}.tmp`;
        try {
          fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
          fs.renameSync(tmp, DB_FILE);
        } catch (err) {
          console.error("[db] write failed:", err.message);
        }
        resolve();
      })
  );
  return writeQueue;
}

/* ------------------------------------------------------------------ */
/*  Domain helpers                                                      */
/* ------------------------------------------------------------------ */

const PROGRAMS = [
  "Registered General Nursing",
  "Registered Midwifery",
  "Registered Mental Health Nursing",
  "Registered Community Nursing",
  "Post-Basic / Faculty",
];
const WEEKLY_GOAL_MINUTES = 600;

/** Local calendar date — UTC slice() was shifting Ghana dates back a day. */
function iso(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function startOfWeek(offset = 0) {
  const x = new Date();
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day + offset * 7);
  return x;
}

function weekBounds(offset = 0) {
  const start = startOfWeek(offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const pointsOf = (minutes, books) => Math.round(minutes + books * 45);

function scopedSessions(scope = "this") {
  if (scope === "all") return db.sessions;
  const { start, end } = weekBounds(scope === "last" ? -1 : 0);
  return db.sessions.filter((s) => {
    const d = new Date(`${s.date}T12:00:00`);
    return d >= start && d <= end;
  });
}

function streakFor(reader) {
  const days = new Set(db.sessions.filter((s) => s.reader === reader).map((s) => s.date));
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

function buildLeaderboard(scope = "this") {
  const scoped = scopedSessions(scope);
  const map = new Map();

  for (const s of scoped) {
    const r = map.get(s.reader) ?? {
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
    };
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
    r.streak = streakFor(name);
    r.badges = [];
    if (r.minutes >= WEEKLY_GOAL_MINUTES) r.badges.push("🎯 Goal Crusher");
    if (r.books >= 5) r.badges.push("📚 Bookworm");
    if (r.days >= 5) r.badges.push("🔥 Consistent");
    if (r.streak >= 3) r.badges.push(`⚡ ${r.streak}-day streak`);
    if (r.sessions >= 8) r.badges.push("🏛️ Library Regular");
  }

  return [...map.values()].sort((a, b) => b.points - a.points || b.minutes - a.minutes);
}

function buildStats(scope = "this") {
  const scoped = scopedSessions(scope);
  const { start } = weekBounds(scope === "last" ? -1 : 0);
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = iso(d);
    return {
      date: key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
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

/* ------------------------------------------------------------------ */
/*  Validation                                                          */
/* ------------------------------------------------------------------ */

function coerceInt(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validateSession(b) {
  const errors = {};
  if (!b || typeof b !== "object") return { errors: { body: "Invalid JSON body." }, clean: null };
  const reader = normalizeName(b.reader);
  const minutes = Math.round(coerceInt(b.minutes, NaN));
  const books = Math.round(coerceInt(b.books, 0));
  if (reader.length < 3) errors.reader = "Reader name must be at least 3 characters.";
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 600)
    errors.minutes = "Minutes must be a number between 5 and 600.";
  if (!Number.isFinite(books) || books < 0 || books > 20)
    errors.books = "Books must be between 0 and 20.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")))
    errors.date = "Date must be in YYYY-MM-DD format.";
  else if (new Date(`${b.date}T12:00:00`) > new Date())
    errors.date = "Date cannot be in the future.";
  if (b.program && !PROGRAMS.includes(b.program)) errors.program = "Unknown programme.";
  return {
    errors,
    clean: {
      reader,
      program: PROGRAMS.includes(b.program) ? b.program : PROGRAMS[0],
      avatar: String(b.avatar || "👩🏾‍⚕️").slice(0, 8),
      minutes,
      books,
      date: String(b.date || ""),
      note: String(b.note || "").slice(0, 120),
    },
  };
}

function validateMessage(b) {
  const errors = {};
  if (!b || typeof b !== "object") return { errors: { body: "Invalid JSON body." } };
  if (!b.name || String(b.name).trim().length < 3) errors.name = "Please enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(String(b.email || ""))) errors.email = "Enter a valid email address.";
  if (!b.message || String(b.message).trim().length < 10)
    errors.message = "Message must be at least 10 characters.";
  return { errors };
}

/* ------------------------------------------------------------------ */
/*  HTTP plumbing                                                       */
/* ------------------------------------------------------------------ */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Request-Id,X-Client,X-Admin-Token",
  "Access-Control-Max-Age": "86400",
};

function issueAdminToken() {
  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return token;
}

function isAdmin(req) {
  const token = String(req.headers["x-admin-token"] || "");
  const expiresAt = adminTokens.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}

function loginLocked(ip) {
  const now = Date.now();
  const attempts = (loginHits.get(ip) || []).filter((time) => now - time < 120_000);
  loginHits.set(ip, attempts);
  return attempts.length >= 5;
}

function recordLoginFail(ip) {
  const attempts = loginHits.get(ip) || [];
  attempts.push(Date.now());
  loginHits.set(ip, attempts);
}

function send(res, status, payload, reqId) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Request-Id": reqId,
  });
  res.end(body);
}

const ok = (res, data, reqId, status = 200) =>
  send(res, status, { ok: true, data, requestId: reqId, at: new Date().toISOString() }, reqId);

const fail = (res, status, message, reqId, extra = {}) =>
  send(res, status, { ok: false, error: { message, status, ...extra }, requestId: reqId }, reqId);

function readBody(req, limit = 1024 * 64) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Malformed JSON"));
      }
    });
    req.on("error", reject);
  });
}

/* simple sliding-window rate limiter: 120 requests / minute / IP */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 120;
}

/* ------------------------------------------------------------------ */
/*  Router                                                              */
/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const p = url.pathname.replace(/\/+$/, "") || "/";
  const ip = req.socket.remoteAddress || "unknown";

  res.on("finish", () =>
    console.log(`[${reqId}] ${req.method} ${p} → ${res.statusCode} (${Date.now() - started}ms)`)
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (rateLimited(ip)) return fail(res, 429, "Too many requests. Slow down.", reqId);

  try {
    /* ---- health & meta ---- */
    if (req.method === "GET" && (p === "/api/health" || p === "/health")) {
      return ok(res, {
        status: "healthy",
        uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
        sessions: db.sessions.length,
        messages: db.messages.length,
        photos: db.photos.length,
        version: "1.0.0",
        node: process.version,
      }, reqId);
    }

    if (req.method === "GET" && p === "/api/meta") {
      return ok(res, { programs: PROGRAMS, goalMinutes: WEEKLY_GOAL_MINUTES }, reqId);
    }

    /* ---- sessions ---- */
    if (p === "/api/sessions") {
      if (req.method === "GET") {
        const scope = url.searchParams.get("scope") || "this";
        const reader = url.searchParams.get("reader");
        const limit = Number(url.searchParams.get("limit") || 0);
        let list = scopedSessions(scope);
        if (reader) list = list.filter((s) => s.reader.toLowerCase() === reader.toLowerCase());
        list = [...list].sort((a, b) => b.createdAt - a.createdAt);
        if (limit > 0) list = list.slice(0, limit);
        return ok(res, list, reqId);
      }

      if (req.method === "POST") {
        const body = await readBody(req);
        const { errors, clean } = validateSession(body);
        if (Object.keys(errors).length)
          return fail(res, 422, "Validation failed.", reqId, { fields: errors });

        const session = {
          ...clean,
          id: body.id && typeof body.id === "string" ? body.id : crypto.randomUUID(),
          createdAt: Date.now(),
        };
        // idempotency: ignore duplicate ids replayed by the offline queue
        if (db.sessions.some((s) => s.id === session.id))
          return ok(res, session, reqId, 200);

        db.sessions.push(session);
        await persist();
        return ok(res, session, reqId, 201);
      }

      if (req.method === "DELETE") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const scope = url.searchParams.get("scope");
        if (scope === "reset") {
          db = seedDB();
          await persist();
          return ok(res, { reset: true, sessions: db.sessions.length }, reqId);
        }
        const target = new Set(scopedSessions(scope || "this").map((s) => s.id));
        const before = db.sessions.length;
        db.sessions = db.sessions.filter((s) => !target.has(s.id));
        await persist();
        return ok(res, { removed: before - db.sessions.length }, reqId);
      }
    }

    const single = p.match(/^\/api\/sessions\/([\w-]+)$/);
    if (single && req.method === "DELETE") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      const before = db.sessions.length;
      db.sessions = db.sessions.filter((s) => s.id !== single[1]);
      if (before === db.sessions.length) return fail(res, 404, "Session not found.", reqId);
      await persist();
      return ok(res, { id: single[1], removed: true }, reqId);
    }

    if (single && req.method === "PATCH") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      const body = await readBody(req);
      const found = db.sessions.find((s) => s.id === single[1]);
      if (!found) return fail(res, 404, "Session not found.", reqId);
      const merged = { ...found, ...body, id: found.id, createdAt: found.createdAt };
      const { errors, clean } = validateSession(merged);
      if (Object.keys(errors).length)
        return fail(res, 422, "Validation failed.", reqId, { fields: errors });
      Object.assign(found, clean);
      await persist();
      return ok(res, found, reqId);
    }

    /* ---- derived reads ---- */
    if (req.method === "GET" && p === "/api/leaderboard") {
      const scope = url.searchParams.get("scope") || "this";
      const program = url.searchParams.get("program");
      const q = (url.searchParams.get("q") || "").toLowerCase();
      let rows = buildLeaderboard(scope);
      if (program && program !== "All programmes")
        rows = rows.filter((r) => r.program === program);
      if (q) rows = rows.filter((r) => r.reader.toLowerCase().includes(q));
      return ok(res, rows, reqId);
    }

    if (req.method === "GET" && p === "/api/stats") {
      return ok(res, buildStats(url.searchParams.get("scope") || "this"), reqId);
    }

    /* ---- contact messages ---- */
    /* ---- admin auth ---- */
    if (req.method === "POST" && p === "/api/admin/login") {
      if (loginLocked(ip))
        return fail(res, 429, "Too many failed logins. Try again in 2 minutes.", reqId);
      const body = await readBody(req);
      const user = String(body.username || "").trim();
      const pass = String(body.password || "");
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loginHits.delete(ip);
        const token = issueAdminToken();
        return ok(res, {
          token,
          role: "librarian",
          username: ADMIN_USER,
          expiresInHours: 8,
          access: "#/admin",
        }, reqId);
      }
      recordLoginFail(ip);
      return fail(res, 401, "Incorrect username or password.", reqId);
    }

    if (req.method === "POST" && p === "/api/admin/logout") {
      const token = String(req.headers["x-admin-token"] || "");
      adminTokens.delete(token);
      return ok(res, { loggedOut: true }, reqId);
    }

    if (req.method === "GET" && p === "/api/admin/me") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      return ok(res, { username: ADMIN_USER, role: "librarian" }, reqId);
    }

    if (req.method === "GET" && p === "/api/admin/overview") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      return ok(res, {
        sessions: db.sessions.length,
        messages: db.messages.length,
        unread: db.messages.filter((m) => m.status === "new").length,
        photos: db.photos.length,
        readers: new Set(db.sessions.map((s) => s.reader)).size,
        week: buildStats("this"),
        lastWeek: buildStats("last"),
      }, reqId);
    }

    if (p === "/api/messages") {
      if (req.method === "POST") {
        const body = await readBody(req);
        const { errors } = validateMessage(body);
        if (Object.keys(errors).length)
          return fail(res, 422, "Validation failed.", reqId, { fields: errors });
        const msg = {
          id: body.id || crypto.randomUUID(),
          name: String(body.name).trim().slice(0, 80),
          email: String(body.email).trim().slice(0, 120),
          topic: String(body.topic || "General enquiry").slice(0, 120),
          message: String(body.message).trim().slice(0, 2000),
          createdAt: Date.now(),
          status: "new",
        };
        if (!db.messages.some((m) => m.id === msg.id)) {
          db.messages.push(msg);
          await persist();
        }
        return ok(res, { id: msg.id, received: true }, reqId, 201);
      }
      if (req.method === "GET") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        return ok(res, [...db.messages].sort((a, b) => b.createdAt - a.createdAt), reqId);
      }
    }

    const msgOne = p.match(/^\/api\/messages\/([\w-]+)$/);
    if (msgOne && req.method === "PATCH") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      const body = await readBody(req);
      const found = db.messages.find((m) => m.id === msgOne[1]);
      if (!found) return fail(res, 404, "Message not found.", reqId);
      if (body.status && ["new", "read", "replied"].includes(body.status))
        found.status = body.status;
      await persist();
      return ok(res, found, reqId);
    }

    if (msgOne && req.method === "DELETE") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      const before = db.messages.length;
      db.messages = db.messages.filter((m) => m.id !== msgOne[1]);
      if (before === db.messages.length) return fail(res, 404, "Message not found.", reqId);
      await persist();
      return ok(res, { id: msgOne[1], removed: true }, reqId);
    }

    /* ---- announcements ---- */
    if (p === "/api/announcements") {
      if (req.method === "GET") return ok(res, db.announcements, reqId);
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req);
        const item = {
          id: crypto.randomUUID(),
          title: String(body.title || "").slice(0, 160),
          body: String(body.body || "").slice(0, 500),
          author: String(body.author || "College Librarian").slice(0, 80),
          createdAt: Date.now(),
        };
        if (!item.title) return fail(res, 422, "Title is required.", reqId);
        db.announcements.unshift(item);
        await persist();
        return ok(res, item, reqId, 201);
      }
    }

    if (p === "/api/content") {
      if (req.method === "GET") return ok(res, normalizeContentPayload(db.content), reqId);
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req);
        db.content = normalizeContentPayload(body);
        await persist();
        return ok(res, db.content, reqId, 201);
      }
    }

    if (p === "/api/content/profile") {
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req);
        db.content.profile = {
          name: String(body.name || db.content.profile.name).slice(0, 120),
          title: String(body.title || db.content.profile.title).slice(0, 120),
          bio: String(body.bio || db.content.profile.bio).slice(0, 700),
          image: String(body.image || db.content.profile.image),
          published: Boolean(body.published),
        };
        await persist();
        return ok(res, db.content.profile, reqId, 201);
      }
    }

    if (p === "/api/content/staff") {
      if (req.method === "GET") return ok(res, [...db.content.staff].sort((a, b) => a.name.localeCompare(b.name)), reqId);
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req);
        const item = {
          id: String(body.id || crypto.randomUUID()),
          name: String(body.name || "Library Staff").slice(0, 120),
          role: String(body.role || "Library Staff").slice(0, 120),
          bio: String(body.bio || "").slice(0, 500),
          image: String(body.image || ""),
        };
        const existing = db.content.staff.findIndex((s) => s.id === item.id);
        if (existing >= 0) db.content.staff[existing] = item;
        else db.content.staff.push(item);
        db.content.staff = [...db.content.staff].sort((a, b) => a.name.localeCompare(b.name));
        await persist();
        return ok(res, item, reqId, 201);
      }
    }

    const staffOne = p.match(/^\/api\/content\/staff\/([^/]+)$/);
    if (staffOne && req.method === "DELETE") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      db.content.staff = db.content.staff.filter((x) => x.id !== staffOne[1]);
      await persist();
      return ok(res, { id: staffOne[1], removed: true }, reqId);
    }

    if (p === "/api/content/documents") {
      if (req.method === "GET") return ok(res, [...db.content.documents].sort((a, b) => a.title.localeCompare(b.title)), reqId);
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req);
        const item = {
          id: String(body.id || crypto.randomUUID()),
          title: String(body.title || "Untitled document").slice(0, 200),
          description: String(body.description || "").slice(0, 500),
          fileName: String(body.fileName || "document").slice(0, 200),
          fileType: String(body.fileType || "application/octet-stream").slice(0, 120),
          fileData: String(body.fileData || ""),
          createdAt: Number(body.createdAt || Date.now()),
        };
        if (!item.title.trim()) return fail(res, 422, "Document title is required.", reqId);
        if (!item.fileData) return fail(res, 422, "Document file is required.", reqId);
        const existing = db.content.documents.findIndex((d) => d.id === item.id);
        if (existing >= 0) db.content.documents[existing] = item;
        else db.content.documents.push(item);
        db.content.documents = [...db.content.documents].sort((a, b) => a.title.localeCompare(b.title));
        await persist();
        return ok(res, item, reqId, 201);
      }
    }

    const docOne = p.match(/^\/api\/content\/documents\/([^/]+)$/);
    if (docOne && req.method === "DELETE") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      db.content.documents = db.content.documents.filter((x) => x.id !== docOne[1]);
      await persist();
      return ok(res, { id: docOne[1], removed: true }, reqId);
    }

    /* ---- community photos (stored as data URLs) ---- */
    if (p === "/api/photos") {
      if (req.method === "GET") {
        return ok(res, db.photos, reqId);
      }
      if (req.method === "POST") {
        if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
        const body = await readBody(req, 4 * 1024 * 1024); // up to 4 MB
        if (!body || typeof body !== "object")
          return fail(res, 400, "Invalid JSON body.", reqId);
        if (typeof body.data !== "string" || !/^data:image\/(png|jpe?g|webp);base64,/.test(body.data))
          return fail(res, 422, "Attach an image (JPG, PNG or WebP).", reqId, {
            fields: { data: "Attach an image (JPG, PNG or WebP)." },
          });
        if (body.data.length > 3 * 1024 * 1024)
          return fail(res, 413, "Image is too large (max 3 MB).", reqId);
        const photo = {
          id: body.id && typeof body.id === "string" ? body.id : crypto.randomUUID(),
          data: body.data,
          caption: String(body.caption || "Community photo").slice(0, 200),
          type: body.type === "group" ? "group" : "photo",
          uploadedAt: Date.now(),
        };
        if (!db.photos.some((x) => x.id === photo.id)) {
          db.photos.push(photo);
          await persist();
        }
        return ok(res, { ...photo, data: undefined, sizeKb: Math.round(photo.data.length / 1024) }, reqId, 201);
      }
    }

    const photo = p.match(/^\/api\/photos\/([\w-]+)$/);
    if (photo && req.method === "DELETE") {
      if (!isAdmin(req)) return fail(res, 401, "Librarian login required.", reqId);
      const before = db.photos.length;
      db.photos = db.photos.filter((x) => x.id !== photo[1]);
      if (before === db.photos.length) return fail(res, 404, "Photo not found.", reqId);
      await persist();
      return ok(res, { id: photo[1], removed: true }, reqId);
    }

    return fail(res, 404, `No route for ${req.method} ${p}`, reqId);
  } catch (err) {
    console.error(`[${reqId}] error:`, err);
    return fail(res, 400, err.message || "Unexpected server error.", reqId);
  }
});

/* ------------------------------------------------------------------ */
/*  Seed data                                                           */
/* ------------------------------------------------------------------ */

function seedDB() {
  const NAMES = [
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
  const sessions = [];
  for (const w of [0, -1]) {
    const { start } = weekBounds(w);
    for (const [reader, program, avatar] of NAMES) {
      const count = 2 + Math.floor(rnd() * 5);
      for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + Math.floor(rnd() * 7));
        if (d > new Date()) continue;
        sessions.push({
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
  return {
    ...EMPTY_DB,
    sessions,
    content: normalizeContentPayload(EMPTY_DB.content),
    announcements: [
      {
        id: "evt-friday",
        title: "JOIN US THIS FRIDAY FOR A WONDERFUL EXPERIENCE",
        body: "3:00 PM – 5:00 PM · Library Reading Hall",
        author: "College Librarian",
        createdAt: Date.now(),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

loadDB();
server.listen(PORT, () => {
  console.log(`\n  🟢 CNMS Library API running at http://localhost:${PORT}`);
  console.log(`     GET  /api/health  /api/leaderboard  /api/stats  /api/sessions`);
  console.log(`     POST /api/sessions  /api/messages  /api/admin/login`);
  console.log(`     Admin desk:  #/admin`);
  console.log(`     Username:    ${ADMIN_USER}`);
  console.log(`     Credentials: configured via server environment\n`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    console.log(`\n[${sig}] flushing database…`);
    await persist();
    server.close(() => process.exit(0));
  });
}
process.on("uncaughtException", (e) => console.error("[fatal]", e));
process.on("unhandledRejection", (e) => console.error("[rejection]", e));
