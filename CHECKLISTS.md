# Security & Performance Checklists

## Security

- [x] **Auth** — Auth0 SPA login; backend verifies JWTs against Auth0's JWKS endpoint
      (`jose`), never trusts a client-supplied user id.
- [x] **Authorization** — every summary-scoped endpoint (share, chat, history) re-checks
      ownership server-side (`findOwnedSummary`) via the authenticated `auth0Sub` → `userId`,
      not just the JWT's presence. A valid token for user A can never read/mutate user B's data.
- [x] **Input validation** — every request body/query is parsed through a zod schema before
      touching business logic; invalid input is rejected with `400`, never silently coerced.
- [x] **Secrets** — no API keys or DB credentials in source; `.env` files are gitignored,
      `.env.example` documents the shape without real values.
- [x] **CORS** — locked to `FRONTEND_ORIGIN`, not a wildcard.
- [x] **Security headers** — `helmet()` on every response (HSTS, `X-Content-Type-Options`,
      no `X-Powered-By`, etc.).
- [x] **Rate limiting** — per-IP limits on the general API, `/summarize`, document upload,
      chat, and the public share endpoint — the last one specifically to make share-token
      brute-forcing impractical even though tokens are already 192-bit random.
- [x] **Secure random tokens** — share links use `crypto.randomBytes(24)`, not `Math.random()`
      or a sequential id.
- [x] **Least-privilege public API** — the public share endpoint (`GET /share/:token`) returns
      only the generated summary output, never the original pasted text, and never any other
      user's data reachable without the exact token.
- [x] **SQL injection** — not applicable in the traditional sense: all queries go through
      Prisma's parameterized query builder, no raw string concatenation into SQL (the one
      `$queryRaw` in the health check is a static `SELECT 1` with no interpolation).
- [x] **File upload limits** — document upload enforces a 10MB size cap and an extension/MIME
      allow-list (PDF/DOCX/TXT) before extraction.
- [x] **Error responses don't leak internals** — unexpected errors return a generic message
      plus a `requestId` for support/log correlation, never a raw stack trace to the client.
- [x] **Auth header redaction in logs** — `pino-http` is configured to redact
      `req.headers.authorization` so bearer tokens never land in log output.
- [ ] **Not yet implemented** — CSRF protection is not needed (no cookie-based sessions; auth
      is a bearer token the SPA attaches explicitly), but if cookie-based auth is ever added,
      revisit this. Also not implemented: WAF/DDoS protection (delegate to the hosting
      platform — Vercel/Render/Railway all provide basic protection at the edge), and secret
      rotation automation (currently manual via the hosting platform's env var UI).

## Performance

- [x] **Indexed queries** — history search/filter/pagination is backed by composite indexes
      matching the actual query shape (`userId` + `createdAt`/`mode`/`provider`); dashboard
      aggregation uses a single `prisma.aggregate` + `groupBy` pass instead of N queries.
- [x] **Pagination everywhere** — history is paginated server-side (max 50/page); nothing
      returns an unbounded result set to the client.
- [x] **In-memory TTL caching** — dashboard stats and the distinct-provider list are cached
      per-user (60–120s), cutting repeat-visit DB load with no added infrastructure.
- [x] **Token-bounded AI context** — chat sends only the summary text + the last 8 turns to
      the model, not the full conversation history, so prompt size (and cost) stays flat as a
      conversation grows instead of growing unboundedly.
- [x] **No extra LLM call for quality scoring** — the quality heuristic is a local word-overlap
      computation, not a second AI round-trip, so it adds no latency to `/summarize`.
- [x] **Fire-and-forget persistence** — the summarize response returns as soon as the AI call
      completes; the DB write happens after, off the response's critical path.
- [x] **Standalone Next.js output** — the frontend Docker image ships only the traced
      dependency subset (`output: "standalone"`), not the full `node_modules`.
- [x] **Debounced search** — the history search box debounces input (400ms) before hitting the
      API, instead of firing a request per keystroke.
- [ ] **Not yet implemented** — no CDN/edge caching layer in front of the API (Vercel already
      edge-caches the frontend's static assets); no read replica for Postgres (unnecessary at
      current scale — the composite indexes are the higher-leverage fix first); no
      request-level response compression middleware (`compression`) — worth adding if payload
      sizes grow, currently summaries are small enough it wasn't a measured bottleneck.
