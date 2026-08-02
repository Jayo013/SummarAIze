# SummarAIze

AI-powered note summarizer — paste text or upload a document, pick a summary style, and get
a fast, grounded, structured summary you can chat about, share, and export.

Built as a full production-shaped SaaS slice: layered Express/TypeScript backend, Postgres
via Prisma, Auth0 auth, a multi-provider AI fallback chain (Gemini → Groq → OpenAI → demo),
and a Next.js 16 frontend — with the engineering practices (tests, CI, Docker, rate limiting,
structured logging, prompt versioning, quality scoring) that separate a portfolio project
from a demo script.

## Features

- **Advanced summary modes** — Quick, Detailed, Study Notes, Executive, Meeting Minutes, Key
  Takeaways, Action Items. Each mode has its own versioned, schema-validated prompt.
- **Document upload** — PDF / DOCX / TXT, extracted server-side and fed straight into the
  summarizer.
- **Analytics dashboard** — total summaries, words processed, compression ratio, most-used
  model, recent activity.
- **Search & filters** — full-text search plus mode/provider/date filters over your summary
  history, paginated.
- **Shareable summaries** — public, read-only links with optional expiration and a
  cryptographically random token (revocable any time).
- **AI chat with a summary** — ask follow-up questions grounded in that summary specifically,
  with a sliding context window so cost stays flat as a conversation grows.
- **User settings** — preferred AI provider, summary style, and export format, all of which
  actually change backend/frontend behavior rather than just being stored.
- **AI quality improvements** — structured JSON generation validated against a per-mode zod
  schema, a versioned prompt registry (with an instant rollback path), and a free heuristic
  quality score (groundedness + conciseness) shown on every summary.
- **Engineering hardening** — rate limiting, request logging, structured error responses with
  a correlatable request id, input validation everywhere, security headers, in-memory TTL
  caching, and API versioning (`/api/v1`, with `/api` kept as a compatibility alias).
- **Cloud-ready** — Dockerfiles for both apps, `docker-compose.yml` for local prod-parity,
  GitHub Actions CI, and a documented Vercel + Render/Railway deployment path.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the diagram and the reasoning behind these,
[API.md](API.md) for the full endpoint reference, and [DEPLOYMENT.md](DEPLOYMENT.md) to ship
it.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Auth0 (SPA login + JWT verification via `jose`) |
| AI | Google Gemini, Groq, OpenAI — automatic fallback chain, structured JSON output |
| Testing | Node's built-in test runner (`node:test`) — no extra framework dependency |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Render/Railway (backend) + managed Postgres, or Docker |

## Project structure

```
SummarAIze/
├── backend/
│   ├── src/
│   │   ├── config/         # zod-validated environment config
│   │   ├── controllers/    # request/response handling per route
│   │   ├── middleware/     # auth, rate limiting, logging, upload, error handling
│   │   ├── prompts/        # versioned prompt templates + per-mode JSON schemas
│   │   ├── routes/         # Express routers, one per resource
│   │   ├── services/       # business logic: AI calls, persistence, scoring, caching
│   │   ├── utils/          # small shared helpers (errors, cache, text)
│   │   ├── app.ts          # Express app wiring (middleware + routes)
│   │   └── server.ts       # entrypoint
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── Dockerfile
├── frontend/
│   └── app/
│       ├── components/     # ShareButton, ChatPanel, QualityBadge — reused across pages
│       ├── dashboard/       page.tsx
│       ├── history/         page.tsx
│       ├── settings/        page.tsx
│       ├── share/[token]/   page.tsx   (public, unauthenticated)
│       ├── page.tsx         # main summarizer
│       └── providers.tsx    # Auth0Provider wrapper
├── .github/workflows/ci.yml
├── docker-compose.yml
├── DEPLOYMENT.md
├── ARCHITECTURE.md
├── API.md
└── CHECKLISTS.md
```

## Getting started (local dev)

**Prerequisites:** Node 20+, a Postgres instance (or Docker), an Auth0 tenant, and at least
one AI provider key (Gemini/Groq/OpenAI — the app degrades to a labeled demo response if
none are set, so you can run it with zero keys to explore the UI).

```bash
# 1. Database — either Docker...
docker compose up -d postgres
# ...or point DATABASE_URL at any Postgres instance you already have.

# 2. Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, AUTH0_*, and at least one AI key
npm install
npx prisma migrate deploy
npm run dev                 # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_* Auth0 + API base
npm install
npm run dev                 # http://localhost:3000
```

Run the backend test suite with `npm test` (from `backend/`) — pure-function tests only, no
live DB or API keys required, so it runs the same in CI as it does locally.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — diagram, folder-by-folder reasoning, key design decisions
- [API.md](API.md) — full endpoint reference
- [DEPLOYMENT.md](DEPLOYMENT.md) — production deployment guide (Vercel + Render/Railway + Docker)
- [CHECKLISTS.md](CHECKLISTS.md) — security and performance checklists

## Project summary (resume-ready)

> **SummarAIze** — Full-stack AI SaaS application (Next.js 16 / Express / PostgreSQL /
> Auth0) that summarizes documents using a multi-provider LLM fallback chain (Gemini, Groq,
> OpenAI) with structured JSON generation, schema validation, and a versioned prompt
> registry. Shipped 10 end-to-end features including document upload with text extraction,
> an analytics dashboard, searchable/paginated history, expiring public share links,
> context-aware AI chat over generated summaries, per-user preferences, and a deterministic
> summary-quality scoring heuristic. Production-hardened with rate limiting, structured
> request-correlated error logging, input validation, Docker + GitHub Actions CI, and a
> documented cloud deployment path.
