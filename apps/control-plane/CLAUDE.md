# @sketch-test/control-plane

> Fastify API server — M0 skeleton proving the import → execute → report vertical slice

## Role

The Control Plane is the central API server. It stores API versions, creates runs, hands out leases to Runners, collects step events, and serves reports to the Web UI. In M0 it is a minimal Fastify app with no auth, no multi-tenancy, and hardcoded ExecutionPlans.

## Quick start

```bash
# Requires PostgreSQL running locally
DATABASE_URL=postgresql://localhost:5432/sketchtest pnpm dev
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check (includes DB status) |
| `POST` | `/api/import` | Import OpenAPI spec (file or URL) |
| `GET` | `/api/api-versions/:id/execution-plan` | Generate ExecutionPlan + create Run |
| `GET` | `/api/runs` | List all runs |
| `GET` | `/api/runs/:id` | Run detail with step events |
| `GET` | `/api/runs/next` | Runner long-poll for next pending run |
| `PUT` | `/api/runs/:id/claim` | Runner atomically claims a run |
| `POST` | `/api/runs/:id/events` | Runner uploads step events (idempotent) |
| `PATCH` | `/api/runs/:id` | Runner updates run status |
| `GET` | `/api/runs/:id/report` | Aggregated run report |

## Architecture

```
apps/control-plane/src/
  main.ts                          # Fastify bootstrap
  db/db.ts                         # PostgreSQL pool + migrations
  shared/id.ts                     # EntityId generation
  shared/errors.ts                 # API error formatting
  modules/
    health/health.routes.ts        # GET /health
    import/                        # POST /api/import
    run/
      run.service.ts               # ExecutionPlan builder + run CRUD
      run.routes.ts                # Run list/detail + plan generation
      lease.service.ts             # Lease acquisition (FOR UPDATE SKIP LOCKED)
      lease.routes.ts              # Runner poll/claim/status
      event.service.ts             # Idempotent event insertion
      event.routes.ts              # Runner event upload
    report/
      report.service.ts            # Run report aggregation
      report.routes.ts             # GET /api/runs/:id/report
```

## Database

PostgreSQL with 3 tables: `api_versions`, `runs`, `step_events`. All use JSONB for flexible contract storage. Migrations run automatically at startup.

Runner lease uses `FOR UPDATE SKIP LOCKED` for concurrency-safe task assignment.

## Key invariants

1. No auth in M0 — CP runs on localhost, Runner and Web are trusted.
2. ExecutionPlans are hardcoded (Fixture BP-01 flow) — Workflow Compiler comes in M2.
3. Events are idempotent by `id` — `ON CONFLICT (id) DO NOTHING`.
4. Secrets are redacted on the Runner side before upload — CP never sees plaintext secrets.
