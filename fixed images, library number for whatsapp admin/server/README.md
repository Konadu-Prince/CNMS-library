# CNMS Library — Backend API

Zero-dependency Node.js REST API (Node 18+) that powers the reading
leaderboard and the contact form.

## Run

```bash
node server/index.js          # http://localhost:8787
PORT=9000 node server/index.js
```

Data is persisted to `server/data/db.json` using atomic writes
(temp file + rename), so the database can never be left half-written.

## Point the frontend at it

The client reads `VITE_API_URL`; on `localhost` it defaults to
`http://localhost:8787`.

```bash
VITE_API_URL=https://api.example.org npm run build
```

If the API is unreachable the UI automatically switches to **offline mode**:
reads are served from local storage and writes are queued in an outbox that is
replayed (idempotently, keyed by `id`) as soon as `/api/health` succeeds.

## Admin desk

Open the website and go to **`#/admin`** (or tap **Librarian Admin** in the footer).

| | |
| --- | --- |
| Username | `librarian` |
| Password | `cnms2026` |

Override with `ADMIN_USER` / `ADMIN_PASS`. Tokens last 8 hours (`X-Admin-Token` header).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness probe: uptime, record counts, version |
| GET | `/api/meta` | Programmes list and weekly goal |
| GET | `/api/leaderboard?scope=this\|last\|all&program=&q=` | Ranked readers with points, streaks, badges |
| GET | `/api/stats?scope=` | Totals + 7-day daily breakdown |
| GET | `/api/sessions?scope=&reader=&limit=` | Raw reading sessions |
| POST | `/api/sessions` | Create a session (validated, idempotent by `id`) |
| DELETE | `/api/sessions/:id` | Delete one session |
| DELETE | `/api/sessions?scope=this` | Clear a period (`scope=reset` reseeds) |
| POST | `/api/messages` | Contact-form submission |
| GET | `/api/messages` | Librarian inbox |
| GET | `/api/announcements` | Homepage announcements |

## Response envelope

```jsonc
// success
{ "ok": true, "data": { }, "requestId": "a1b2c3d4", "at": "2026-01-01T09:00:00.000Z" }

// failure
{ "ok": false, "error": { "message": "Validation failed.", "status": 422,
                          "fields": { "minutes": "Minutes must be between 5 and 600." } },
  "requestId": "a1b2c3d4" }
```

## Reliability features

- **Atomic persistence** — no partial writes, survives crashes
- **Graceful shutdown** — flushes the DB on `SIGINT` / `SIGTERM`
- **Validation** on every write, returning per-field `422` errors
- **Idempotent creates** — replayed offline writes never duplicate
- **Rate limiting** — 120 requests/minute per IP (`429`)
- **CORS** preflight support and body-size limits (64 KB)
- **Correlation IDs** (`X-Request-Id`) shared between client and server logs
- **Structured request logging** with status codes and latency
- Uncaught exception / rejection guards keep the process alive

## Client-side reliability

- 8 s request timeouts via `AbortController`
- Exponential-backoff retries on network errors, `5xx` and `429` (never on `4xx`)
- Health polling every 20 s, plus on window focus and browser `online` events
- Optimistic UI writes with rollback on server validation failure
- Live connection badge in the header showing state, endpoint and queue depth
