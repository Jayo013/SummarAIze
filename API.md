# API Reference

Base URL: `{FRONTEND_ORIGIN-configured backend}/api/v1` (canonical) — `/api` is mounted on
the same router as a backward-compatible alias, see [ARCHITECTURE.md](ARCHITECTURE.md).

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <Auth0 access token>`
and return `401 { "error": "Unauthorized" }` if missing/invalid. Validation failures return
`400` with an `error` message (and sometimes a zod `detail` object). Unexpected errors return
`500` and include a `requestId` you can correlate with server logs.

Rate limits (per IP, 15-minute window): general API 100 req, `/summarize` and document
upload 20 req, chat 30 req, public share lookup 60 req.

---

## Health

### `GET /health`
No auth. Always returns `200`, even if the database is down (check `db` yourself if you
need to alert on that specifically).

```json
{ "ok": true, "db": "connected", "apiVersion": "v1", "env": "production", "uptimeSeconds": 4213, "timestamp": "..." }
```

## Summarize

### `POST /summarize` 🔒
Rate-limited. Body:
```json
{ "text": "string, 1-20000 chars", "mode": "quick | detailed | study_notes | executive | meeting_minutes | key_takeaways | action_items" }
```
Response:
```json
{
  "summary": "string",
  "provider": "gemini | groq | openai | demo",
  "model": "string | undefined",
  "promptVersion": "v2",
  "structured": true,
  "mode": "quick",
  "id": "uuid — the persisted summary's id, usable immediately for share/chat",
  "qualityScore": 92,
  "qualityFlags": []
}
```
Honors the caller's `preferredProvider` setting (tried first, with automatic fallback through
the others). Persistence is fire-and-forget — a DB hiccup never fails or delays this response.

## Documents

### `POST /documents/extract` 🔒
Rate-limited. `multipart/form-data` with a `file` field — PDF, DOCX, or TXT, max 10MB.
```json
{ "text": "extracted text", "truncated": false, "fileName": "notes.pdf", "charCount": 4213 }
```

## Dashboard

### `GET /dashboard` 🔒
```json
{
  "totalSummaries": 42,
  "totalWordsProcessed": 15302,
  "avgCompressionRatio": 0.18,
  "mostUsedModel": "gemini-2.0-flash",
  "recentActivity": [ { "id", "mode", "provider", "model", "inputWordCount", "outputWordCount", "createdAt" } ]
}
```

## History (search & filters)

### `GET /summaries` 🔒
Query params (all optional except pagination defaults): `search`, `mode`, `provider`,
`dateFrom`, `dateTo` (ISO 8601), `page` (default 1), `limit` (default 10, max 50).
```json
{ "items": [ { "id", "mode", "provider", "model", "inputWordCount", "outputWordCount", "preview", "createdAt", "promptVersion", "qualityScore", "qualityFlags" } ], "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
```

### `GET /summaries/providers` 🔒
Distinct providers the caller has actually used (for populating a filter dropdown).
```json
{ "providers": ["gemini", "openai"] }
```

## Sharing

### `GET /summaries/:id/share` 🔒
Current share status for a summary you own, or `{ "share": null }` if none exists.

### `POST /summaries/:id/share` 🔒
Body: `{ "expiresInDays"?: 1-365 }` (omit for a link that never expires). Creates the link if
none exists, or rotates the token/expiry if one already does (idempotent — one active share
per summary).
```json
{ "share": { "token": "...", "url": "https://.../share/<token>", "expiresAt": "... | null" } }
```

### `DELETE /summaries/:id/share` 🔒
Revokes the share link. `204 No Content`.

### `GET /share/:token`
**No auth** — public. Returns only the generated summary output, never the original pasted
text.
```json
{ "summary": "...", "mode": "quick", "provider": "gemini", "model": "...", "createdAt": "...", "expiresAt": "... | null" }
```
`404` if the token doesn't exist, was revoked, or has expired.

## AI Chat

### `GET /summaries/:id/chat` 🔒
```json
{ "messages": [ { "id", "role": "user | assistant", "content", "createdAt" } ] }
```

### `POST /summaries/:id/chat` 🔒
Rate-limited. Body: `{ "message": "string, 1-2000 chars" }`. The model only sees the summary
text + the last 8 turns of conversation (not the full history), so token cost stays flat
regardless of how long the conversation runs.
```json
{ "reply": "...", "provider": "gemini", "model": "...", "userMessage": {...}, "assistantMessage": {...} }
```

### `DELETE /summaries/:id/chat` 🔒
Clears the conversation for that summary. `204 No Content`.

## Settings

### `GET /settings` 🔒
Auto-creates the user row on first call.
```json
{ "preferredProvider": "gemini | groq | openai | null", "preferredMode": "quick", "preferredExportFormat": "txt" }
```

### `PUT /settings` 🔒
Body: any subset of the fields above. Returns the full updated settings object.

---

🔒 = requires `Authorization: Bearer <token>`
