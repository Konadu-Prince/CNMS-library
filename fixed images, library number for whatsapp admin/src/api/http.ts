import { ApiEnvelope, ApiError } from "./types";

const TOKEN_KEY = "cnms-admin-token";

export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

/** Base URL of the backend. Override with VITE_API_URL at build time. */
export const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8787"
    : "");

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch wrapper providing:
 *  - request timeouts (AbortController)
 *  - exponential-backoff retries on network / 5xx errors
 *  - envelope unwrapping and typed ApiError
 *  - correlation ids so client logs match server logs
 */
export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, timeout = 8000, retries = 2 } = opts;
  if (!API_BASE) throw new ApiError("No backend configured", 0);

  let lastError: ApiError = new ApiError("Request failed", 0);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const requestId = crypto.randomUUID().slice(0, 8);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "X-Client": "cnms-web",
          ...(getAdminToken() ? { "X-Admin-Token": getAdminToken() } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: opts.signal ?? controller.signal,
      });
      clearTimeout(timer);

      let json: ApiEnvelope<T> | null = null;
      try {
        json = (await res.json()) as ApiEnvelope<T>;
      } catch {
        /* non-JSON response */
      }

      if (!res.ok || !json?.ok) {
        const err = new ApiError(
          json?.error?.message || `Request failed with status ${res.status}`,
          res.status,
          json?.error?.fields,
          json?.requestId
        );
        // 4xx are deterministic — do not retry
        if (res.status < 500 && res.status !== 429) throw err;
        lastError = err;
      } else {
        return json.data as T;
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
      lastError =
        err?.name === "AbortError"
          ? new ApiError("The server took too long to respond.", 408)
          : new ApiError(err?.message || "Network unreachable.", 0);
    }

    if (attempt < retries) await sleep(300 * Math.pow(2, attempt));
  }

  throw lastError;
}

/** Lightweight liveness probe used by the connection monitor. */
export async function ping(timeout = 3500): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    await request<unknown>("/api/health", { timeout, retries: 0 });
    return true;
  } catch {
    return false;
  }
}
