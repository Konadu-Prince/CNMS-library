/**
 * Unified data repository.
 *
 * Every read/write goes through here. It talks to the REST backend when it is
 * healthy and transparently falls back to the local adapter otherwise, queuing
 * writes in an outbox that is replayed (idempotently, by id) the moment the
 * server comes back.
 */
import * as local from "./local";
import { API_BASE, getAdminToken, ping, request, setAdminToken } from "./http";
import {
  ApiError,
  ConnectionState,
  ContactMessage,
  NewSession,
  Row,
  Scope,
  Session,
  Stats,
} from "./types";
import type { Photo } from "./local";

export * from "./types";
export { API_BASE } from "./http";
export { prettyRange, weekBounds, iso, toCSV, pointsOf } from "./local";
export type { Photo } from "./local";

/* ------------------------- connection monitor ------------------------- */

let state: ConnectionState = "connecting";
let lastCheck = 0;
let pendingCount = local.outbox().length;

const listeners = new Set<() => void>();

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((f) => f());
}

export const getConnection = () => ({
  state,
  pending: pendingCount,
  base: API_BASE || "local storage",
  lastCheck,
});

function setState(next: ConnectionState) {
  if (state !== next) {
    state = next;
    emit();
  }
  lastCheck = Date.now();
}

/** Probe the backend; called on boot, every 20s, and on window focus. */
export async function checkHealth(): Promise<boolean> {
  if (!API_BASE) {
    setState("offline");
    return false;
  }
  const alive = await ping();
  setState(alive ? "online" : "offline");
  if (alive) await flushOutbox();
  return alive;
}

let monitorStarted = false;
export function startMonitor() {
  if (monitorStarted) return;
  monitorStarted = true;
  void checkHealth();
  setInterval(() => void checkHealth(), 20_000);
  window.addEventListener("focus", () => void checkHealth());
  window.addEventListener("online", () => void checkHealth());
  window.addEventListener("offline", () => setState("offline"));
}

/* ---------------------------- outbox sync ---------------------------- */

export async function flushOutbox() {
  const queue = local.outbox();
  if (queue.length === 0) {
    if (pendingCount !== 0) {
      pendingCount = 0;
      emit();
    }
    return;
  }
    const remaining: local.OutboxItem[] = [];
  for (const item of queue) {
    try {
      if (item.kind === "session")
        await request<Session>("/api/sessions", { method: "POST", body: item.payload });
      else if (item.kind === "message")
        await request("/api/messages", { method: "POST", body: item.payload });
      else
        await request("/api/photos", {
          method: "POST",
          body: item.payload,
          timeout: 20_000,
          retries: 1,
        });
    } catch (err) {
      // Validation failures are permanent — drop them; everything else retries.
      if (!(err instanceof ApiError && err.status >= 400 && err.status < 500))
        remaining.push(item);
    }
  }
  local.setOutbox(remaining);
  pendingCount = remaining.length;
  emit();
}

/* ------------------------------- reads ------------------------------- */

async function tryRemote<T>(path: string, fallback: () => T): Promise<T> {
  if (API_BASE && state !== "offline") {
    try {
      const data = await request<T>(path);
      setState("online");
      return data;
    } catch {
      setState("offline");
    }
  }
  return fallback();
}

export const api = {
  async leaderboard(scope: Scope, program?: string, q?: string): Promise<Row[]> {
    const qs = new URLSearchParams({ scope });
    if (program) qs.set("program", program);
    if (q) qs.set("q", q);
    return tryRemote<Row[]>(`/api/leaderboard?${qs}`, () => local.leaderboard(scope, program, q));
  },

  async stats(scope: Scope): Promise<Stats> {
    return tryRemote<Stats>(`/api/stats?scope=${scope}`, () => local.stats(scope));
  },

  async sessions(scope: Scope, limit = 0): Promise<Session[]> {
    const qs = new URLSearchParams({ scope });
    if (limit) qs.set("limit", String(limit));
    return tryRemote<Session[]>(`/api/sessions?${qs}`, () => local.listSessions(scope, limit));
  },

  /* ------------------------------ writes ------------------------------ */

  /** Optimistic write: saved locally first, then pushed (or queued) to the API. */
  async createSession(input: NewSession): Promise<{ session: Session; synced: boolean }> {
    const id = input.id ?? crypto.randomUUID();
    const session = local.createSession({ ...input, id });
    emit();

    if (API_BASE) {
      try {
        await request<Session>("/api/sessions", { method: "POST", body: { ...input, id } });
        setState("online");
        return { session, synced: true };
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          local.deleteSession(id);
          emit();
          throw err;
        }
        setState("offline");
      }
    }
    local.enqueue({ kind: "session", payload: { ...input, id } });
    pendingCount = local.outbox().length;
    emit();
    return { session, synced: false };
  },

  async deleteSession(id: string): Promise<void> {
    local.deleteSession(id);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/sessions/${id}`, { method: "DELETE", retries: 1 });
      } catch {
        /* already gone locally; server reconciles on next reset */
      }
    }
  },

  async clearScope(scope: Scope): Promise<void> {
    local.clearScope(scope);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/sessions?scope=${scope}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    }
  },

  async resetAll(): Promise<void> {
    local.resetAll();
    emit();
    if (API_BASE) {
      try {
        await request(`/api/sessions?scope=reset`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    }
  },

  async sendMessage(m: ContactMessage): Promise<{ synced: boolean }> {
    const id = m.id ?? crypto.randomUUID();
    if (API_BASE) {
      try {
        await request("/api/messages", { method: "POST", body: { ...m, id } });
        setState("online");
        return { synced: true };
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) throw err;
        setState("offline");
      }
    }
    local.saveMessage({ ...m, id });
    local.enqueue({ kind: "message", payload: { ...m, id } });
    pendingCount = local.outbox().length;
    emit();
    return { synced: false };
  },

  /* ------------------------------ photos ------------------------------ */

  async listPhotos(): Promise<Photo[]> {
    return tryRemote<Photo[]>("/api/photos", () => local.listPhotos());
  },

  /** Stores locally first (so it always displays), then uploads to the API. */
  async addPhoto(photo: Photo): Promise<{ synced: boolean }> {
    local.savePhoto(photo);
    emit();
    if (API_BASE) {
      try {
        await request("/api/photos", {
          method: "POST",
          body: photo,
          timeout: 20_000,
          retries: 1,
        });
        setState("online");
        return { synced: true };
      } catch (err) {
        if (err instanceof ApiError && err.status === 413) throw err;
        setState("offline");
      }
    }
    local.enqueue({ kind: "photo", payload: photo });
    pendingCount = local.outbox().length;
    emit();
    return { synced: false };
  },

  async deletePhoto(id: string): Promise<void> {
    local.deletePhoto(id);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/photos/${id}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    }
  },

  /* ------------------------------ admin ------------------------------ */

  async login(username: string, password: string): Promise<{ source: "server" | "local" }> {
    if (API_BASE) {
      try {
        const data = await request<{ token: string }>("/api/admin/login", {
          method: "POST",
          body: { username, password },
          retries: 0,
        });
        setAdminToken(data.token);
        setState("online");
        emit();
        return { source: "server" };
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) throw err;
        if (err instanceof ApiError && err.status === 429) throw err;
      }
    }
    throw new ApiError("The backend is unavailable. Start the API and try again.", 503);
  },

  logout() {
    const token = getAdminToken();
    setAdminToken("");
    if (API_BASE && token) {
      void request("/api/admin/logout", { method: "POST", retries: 0 }).catch(() => undefined);
    }
    emit();
  },

  isAdmin() {
    return Boolean(getAdminToken());
  },

  async messages(): Promise<ContactMessage[]> {
    return tryRemote<ContactMessage[]>("/api/messages", () => local.listMessages());
  },

  async markMessage(id: string, status: ContactMessage["status"]) {
    local.updateMessageStatus(id, status);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/messages/${id}`, { method: "PATCH", body: { status } });
      } catch {
        /* ignore */
      }
    }
  },

  async deleteMessage(id: string) {
    local.deleteMessage(id);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/messages/${id}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    }
  },

  async updateSession(id: string, patch: Partial<Session>) {
    local.updateSession(id, patch);
    emit();
    if (API_BASE) {
      try {
        await request(`/api/sessions/${id}`, { method: "PATCH", body: patch });
        setState("online");
      } catch {
        setState("offline");
      }
    }
  },

  async overview() {
    if (API_BASE && state !== "offline") {
      try {
        const data = await request<{
          sessions: number;
          messages: number;
          unread: number;
          photos: number;
          readers: number;
          week: Stats;
          lastWeek: Stats;
        }>("/api/admin/overview");
        setState("online");
        return data;
      } catch {
        setState("offline");
      }
    }
    const week = local.stats("this");
    const lastWeek = local.stats("last");
    const messages = local.listMessages();
    return {
      sessions: local.listSessions("all").length,
      messages: messages.length,
      unread: messages.filter((m) => !m.status || m.status === "new").length,
      photos: local.listPhotos().length,
      readers: local.leaderboard("all").length,
      week,
      lastWeek,
    };
  },
};

export { getAdminToken, setAdminToken };
