# Production Deployment Guide

SummarAIze is two independently deployable services plus a managed Postgres database:

```
frontend  → Vercel                Next.js 16, static/SSR, reads NEXT_PUBLIC_* at build time
backend   → Render / Railway      Express API, reads secrets at runtime
database  → Neon / Supabase / Render Postgres   any managed Postgres works
```

They communicate only over HTTPS (`NEXT_PUBLIC_API_BASE` → backend `FRONTEND_ORIGIN` CORS allow-list), so each can be redeployed independently.

## 1. Provision Postgres

Any managed Postgres works — Neon and Supabase both have a free tier and are the easiest to
get a `DATABASE_URL` from in under a minute. Render/Railway can also host the DB alongside
the backend if you'd rather keep everything on one platform/bill.

Once you have a connection string, run the migrations against it from your machine:

```bash
cd backend
DATABASE_URL="<your production connection string>" npx prisma migrate deploy
```

`migrate deploy` (not `migrate dev`) is the production-safe command — it applies the
already-committed migration files under `prisma/migrations/` without prompting or
generating new ones.

## 2. Backend — Render or Railway

Both platforms build from a Dockerfile or a native Node buildpack; the repo's
[`backend/Dockerfile`](backend/Dockerfile) works with either.

**Build/start commands (if not using the Dockerfile):**
- Build: `npm ci && npx prisma generate && npm run build`
- Start: `npm start`

**Required environment variables** (see [`backend/.env.example`](backend/.env.example)):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | From step 1 |
| `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` | From your Auth0 API settings |
| `FRONTEND_ORIGIN` | Your deployed frontend origin, e.g. `https://summaraize.vercel.app` — used for CORS |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` | At least one; the summarizer and chat fall back through them in order and degrade to a demo response if none are set |
| `NODE_ENV` | `production` |
| `PORT` | Usually injected by the platform; defaults to `4000` |

**Health check:** point the platform's health check at `GET /api/health` (or `/api/v1/health`).
It returns `200` with `{ ok, db, apiVersion, env, uptimeSeconds }` even if the database is
briefly unreachable, so a DB blip doesn't flap the whole service — check the `db` field if
you need to alert specifically on database connectivity.

## 3. Frontend — Vercel

Import the repo, set the **root directory to `frontend`**, and set these as Vercel
**build-time** env vars (Project Settings → Environment Variables) — they're inlined into
the client bundle at build, so they must be present *before* `next build` runs, not just at
runtime:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://<your-backend-host>/api` |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Same Auth0 tenant as the backend |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 SPA application client ID |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | Must match the backend's `AUTH0_AUDIENCE` |

`npm run build` runs `scripts/check-env.mjs` first (see `prebuild` in
[`frontend/package.json`](frontend/package.json)) and fails fast with a clear message if any
of these are missing, instead of shipping a broken client bundle.

## 4. Auth0 configuration

In your Auth0 Application settings, add:
- **Allowed Callback URLs**: `https://<frontend-domain>`
- **Allowed Logout URLs**: `https://<frontend-domain>`
- **Allowed Web Origins**: `https://<frontend-domain>`

And in the associated Auth0 API, confirm the **Identifier** matches `AUTH0_AUDIENCE` /
`NEXT_PUBLIC_AUTH0_AUDIENCE` above exactly.

## 5. CI/CD

[`/.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push/PR to `main` and
`develop`: backend typecheck + unit tests, frontend lint + typecheck + production build. It
uses dummy env values (no real secrets needed) since the checks don't touch a live database
or AI provider. Treat a green run as the merge gate; neither Vercel nor Render/Railway
deploys are wired to wait on it automatically — set that up as a required status check in
the repo's branch protection rules if you want it enforced.

## 6. Local Docker Compose (optional, dev/staging parity)

```bash
cp backend/.env.example backend/.env        # fill in real keys
cp frontend/.env.local.example frontend/.env.local
docker compose up --build
```

This builds and runs Postgres, the backend, and the frontend together — useful for
verifying a production-shaped build locally before pushing, but Vercel + Render/Railway
(steps 1–3) is the recommended path for the actual production deployment since each service
then scales, logs, and redeploys independently.

## 7. Rollback

Both Vercel and Render/Railway keep prior deploys — use their dashboard's "redeploy a
previous build" action. Because migrations are additive-only in this project's history
(no destructive column drops), rolling the backend back a version does not require a
matching down-migration; if a future migration does drop or rename a column, roll back the
database and the backend together.
