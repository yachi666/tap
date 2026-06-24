# @sketch-test/control-plane

> Fastify API server — IAM, API import, run orchestration, workflow compilation, scheduling, reporting

## Role

The Control Plane is the central API server. It manages workspaces, users, API versions, test cases, workflows, environments, datasets, test suites, policies, and schedules. It creates runs, hands out leases to Runners, collects step events, and serves reports to the Web UI and CLI.

Currently covers M1 and M2 features with 14 modules, ~80 API endpoints, and 22 PostgreSQL tables.

## Quick start

```bash
# Requires PostgreSQL running locally
DATABASE_URL=postgresql://localhost:5432/sketchtest pnpm dev:cp
```

## API

### Health
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check (includes DB status) |

### IAM
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List workspaces |
| `GET` | `/api/workspaces/:id` | Get workspace detail |
| `GET` | `/api/workspaces/:id/users` | List workspace members |
| `POST` | `/api/workspaces/:id/users` | Add user to workspace |
| `PATCH` | `/api/users/:id/role` | Change user role |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `GET` | `/api/auth/me` | Get current user (auth required) |
| `POST` | `/api/service-accounts` | Create service account |
| `GET` | `/api/workspaces/:id/service-accounts` | List service accounts |
| `POST` | `/api/service-accounts/:id/revoke` | Revoke service account |

### Import
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/import` | Import API spec (OpenAPI, Postman, HAR) |
| `GET` | `/api/api-versions/:targetId/diff` | Diff two API versions |

### API Versions & Runs
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/api-versions` | List API versions |
| `GET` | `/api/api-versions/:id` | Get API version detail |
| `GET` | `/api/api-versions/:id/execution-plan` | Generate ExecutionPlan + create Run |
| `POST` | `/api/runs` | Create a run (custom workflow) |
| `POST` | `/api/runs/from-workflow` | Create run from published workflow |
| `GET` | `/api/runs` | List all runs |
| `GET` | `/api/runs/:id` | Run detail with step events |
| `GET` | `/api/runs/:id/report` | Aggregated run report |

### Runner Leases & Events
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/runs/next` | Runner long-poll for next pending run |
| `PUT` | `/api/runs/:id/claim` | Runner atomically claims a run |
| `PATCH` | `/api/runs/:id` | Runner updates run status |
| `POST` | `/api/runs/:id/events` | Runner uploads step events (idempotent) |
| `GET` | `/api/runs/:id/evidence-manifest` | Get evidence manifest |
| `GET` | `/api/runs/:id/evidence-verify` | Verify evidence integrity |

### Runner Registry
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/runners/register` | Register a new runner |
| `GET` | `/api/runners` | List runners |
| `GET` | `/api/runners/:id` | Get runner detail |
| `PATCH` | `/api/runners/:id/status` | Update runner status |
| `DELETE` | `/api/runners/:id` | Remove runner |
| `POST` | `/api/runners/:id/heartbeat` | Runner heartbeat |

### Workflows
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/workflows` | Create workflow |
| `GET` | `/api/workflows` | List workflows |
| `GET` | `/api/workflows/:id` | Get workflow detail |
| `PATCH` | `/api/workflows/:id` | Update workflow |
| `DELETE` | `/api/workflows/:id` | Delete workflow |
| `POST` | `/api/workflows/:id/versions` | Save new draft version |
| `GET` | `/api/workflows/:id/versions` | List workflow versions |
| `GET` | `/api/workflow-versions/:id` | Get workflow version detail |
| `POST` | `/api/workflow-versions/:id/publish` | Publish version (compile + freeze) |
| `POST` | `/api/workflow-versions/:id/compile` | Compile to ExecutionPlan (preview) |
| `POST` | `/api/workflows/compile` | Compile inline definition |
| `GET` | `/api/workflow-versions/:id/plan` | Get compiled ExecutionPlan |

### Test Cases
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/test-cases` | Create test case |
| `GET` | `/api/test-cases` | List test cases |
| `GET` | `/api/test-cases/:id` | Get test case detail |
| `PATCH` | `/api/test-cases/:id` | Update test case |
| `DELETE` | `/api/test-cases/:id` | Delete test case |
| `POST` | `/api/test-cases/:id/versions` | Save new draft version |
| `GET` | `/api/test-cases/:id/versions` | List test case versions |
| `GET` | `/api/test-case-versions/:id` | Get version detail |
| `POST` | `/api/test-case-versions/:id/publish` | Publish version |
| `GET` | `/api/test-case-versions/compare` | Compare two versions |

### Test Suites
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/test-suites` | Create test suite |
| `GET` | `/api/test-suites` | List test suites |
| `GET` | `/api/test-suites/:id` | Get test suite detail |
| `DELETE` | `/api/test-suites/:id` | Delete test suite |
| `POST` | `/api/test-suites/:id/versions` | Save new version |
| `GET` | `/api/test-suites/:id/versions` | List versions |
| `GET` | `/api/test-suite-versions/:id` | Get version detail |
| `POST` | `/api/test-suite-versions/:id/evaluate` | Evaluate quality gate |

### Generation
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/generation-jobs` | Start generation job |
| `GET` | `/api/generation-jobs` | List generation jobs |
| `GET` | `/api/generation-jobs/:id` | Get job status |
| `GET` | `/api/generation-jobs/:id/drafts` | List generated drafts |
| `GET` | `/api/drafts/:id` | Get draft detail |
| `POST` | `/api/drafts/:id/accept` | Accept draft → publish test case |
| `POST` | `/api/drafts/:id/reject` | Reject draft |

### Environments & Secrets
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/environments` | Create environment |
| `GET` | `/api/environments` | List environments |
| `GET` | `/api/environments/:id` | Get environment detail |
| `PATCH` | `/api/environments/:id` | Update environment |
| `DELETE` | `/api/environments/:id` | Delete environment |
| `POST` | `/api/environments/:id/versions` | Save new version |
| `GET` | `/api/environments/:id/versions` | List versions |
| `GET` | `/api/environment-versions/:id` | Get version detail |
| `POST` | `/api/secrets` | Create secret |
| `GET` | `/api/secrets` | List secrets (values masked) |
| `PATCH` | `/api/secrets/:id` | Update secret |
| `DELETE` | `/api/secrets/:id` | Delete secret |
| `POST` | `/api/secrets/:id/decrypt` | Decrypt secret (auth required) |

### Datasets
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/datasets` | Create dataset |
| `GET` | `/api/datasets` | List datasets |
| `GET` | `/api/datasets/:id` | Get dataset detail |
| `DELETE` | `/api/datasets/:id` | Delete dataset |
| `POST` | `/api/datasets/:id/versions` | Save new version |
| `GET` | `/api/datasets/:id/versions` | List versions |
| `GET` | `/api/dataset-versions/:id` | Get version detail |
| `POST` | `/api/datasets/import/json` | Import JSON dataset |
| `POST` | `/api/datasets/import/csv` | Import CSV dataset |

### Policies
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/policies` | Create policy |
| `GET` | `/api/policies` | List policies |
| `GET` | `/api/policies/:id` | Get policy detail |
| `PATCH` | `/api/policies/:id` | Update policy |
| `DELETE` | `/api/policies/:id` | Delete policy |
| `POST` | `/api/policies/evaluate` | Evaluate policy against context |

### Schedules
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/schedules` | Create schedule |
| `GET` | `/api/schedules` | List schedules |
| `GET` | `/api/schedules/:id` | Get schedule detail |
| `PATCH` | `/api/schedules/:id` | Update schedule |
| `DELETE` | `/api/schedules/:id` | Delete schedule |
| `POST` | `/api/schedules/:id/trigger-now` | Trigger immediate run |

## Architecture

```
apps/control-plane/src/
  main.ts                              # Fastify bootstrap, 16 route modules registered
  db/db.ts                             # PostgreSQL pool + M0–M2 migrations (22 tables)
  shared/id.ts                         # EntityId generation (prefixed, URL-safe)
  modules/
    health/health.routes.ts            # GET /health
    iam/
      iam.service.ts                   # Workspace + user + service account CRUD
      iam.routes.ts                    # Auth endpoints (login, me) + workspace management
      auth.middleware.ts               # JWT verification middleware
    import/
      import.service.ts                # Multi-format import orchestration
      import.routes.ts                 # POST /api/import
      diff.service.ts                  # API version diff computation
    run/
      run.service.ts                   # ExecutionPlan builder + run CRUD
      run.routes.ts                    # Run list/detail + API version endpoints
      lease.service.ts                 # Lease acquisition (FOR UPDATE SKIP LOCKED)
      lease.routes.ts                  # Runner poll/claim/status
      event.service.ts                 # Idempotent event insertion
      event.routes.ts                  # Runner event upload + evidence endpoints
      schedule.service.ts              # Cron-based scheduling engine
      schedule.routes.ts               # Schedule CRUD
    runner-registry/
      runner-registry.service.ts       # Runner registration + heartbeat management
      runner-registry.routes.ts        # Runner CRUD + heartbeat endpoints
    workflow/
      workflow.service.ts              # Workflow CRUD + versioning
      workflow.routes.ts               # Workflow + compile + publish endpoints
      workflow-compiler.ts             # WorkflowDefinition → ExecutionPlan compiler
    test-authoring/
      test-authoring.service.ts        # Test case CRUD + versioning + publishing
      test-authoring.routes.ts         # Test case endpoints
    test-suite/
      test-suite.service.ts            # Test suite CRUD + quality gate evaluation
      test-suite.routes.ts             # Test suite endpoints
    generation/
      generation.service.ts            # Rule-based test generation engine
      generation.routes.ts             # Generation job + draft endpoints
    environment/
      environment.service.ts           # Environment CRUD + versioning
      environment.routes.ts            # Environment + secrets endpoints
    dataset/
      dataset.service.ts               # Dataset CRUD + JSON/CSV import
      dataset.routes.ts                # Dataset endpoints
    policy/
      policy.service.ts                # Policy CRUD + evaluation engine
      policy.routes.ts                 # Policy endpoints
    report/
      report.service.ts                # Run report aggregation
      report.routes.ts                 # GET /api/runs/:id/report
```

## Database

PostgreSQL with 22 tables across three migration groups:

**M0 (Core execution):** `api_versions`, `runs`, `step_events`
**M1 (IAM, env, tests, generation, runners):** `workspaces`, `users`, `service_accounts`, `environments`, `environment_versions`, `secrets`, `test_cases`, `test_case_versions`, `generation_jobs`, `generated_drafts`, `runners`, `runner_heartbeats`
**M2 (Workflows, datasets, suites, policies, schedules):** `workflows`, `workflow_versions`, `datasets`, `dataset_versions`, `test_suites`, `test_suite_versions`, `schedule_configs`, `policies`

All tables use TEXT primary keys (prefixed, URL-safe identifiers). JSONB for flexible contract storage. Migrations run automatically at startup via `CREATE TABLE IF NOT EXISTS`.

Runner lease uses `FOR UPDATE SKIP LOCKED` for concurrency-safe task assignment.

## Key invariants

1. **JWT auth** — `POST /api/auth/login` returns a token; protected routes use `requireAuth()` middleware.
2. **ExecutionPlans are compiled from WorkflowDefinitions** at publish time by the Workflow Compiler.
3. **Events are idempotent** by `id` — `ON CONFLICT (id) DO NOTHING`.
4. **Secrets are redacted on the Runner side** before upload — CP stores encrypted values, never sees plaintext at rest.
5. **Published versions are immutable** — ApiVersion, TestCaseVersion, WorkflowVersion, EnvironmentVersion, DatasetVersion.
6. **Control Plane, Runner, and Web are independent processes** — they share only versioned contracts.

## Dependencies

- `fastify` — HTTP framework
- `pg` — PostgreSQL driver (no ORM)
- `@sketch-test/contracts-common` — EntityId, ContentHash, Instant, diagnostics
- `@sketch-test/canonical-api-model` — API import target
- `@sketch-test/runner-protocol` — ExecutionPlan, RunEvents, lease protocol
- `@sketch-test/test-dsl` — TestDefinition, assertions
- `@sketch-test/workflow-dsl` — WorkflowDefinition (compiler input)
