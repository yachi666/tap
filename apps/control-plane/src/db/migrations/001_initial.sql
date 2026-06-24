-- 001_initial.sql — M0 Control Plane schema
-- Run: psql $DATABASE_URL -f apps/control-plane/src/db/migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS api_versions (
  id              TEXT PRIMARY KEY,
  source_type     TEXT NOT NULL,             -- 'file' | 'url'
  source_location TEXT NOT NULL,             -- file path or URL
  content_hash    TEXT NOT NULL,             -- SHA-256 of raw spec
  spec_json       JSONB NOT NULL,            -- CanonicalApiModel serialized
  diagnostics     JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id              TEXT PRIMARY KEY,
  api_version_id  TEXT NOT NULL REFERENCES api_versions(id),
  status          TEXT NOT NULL DEFAULT 'pending',
    -- 'pending' | 'claimed' | 'running' | 'passed' | 'failed' | 'cancelled' | 'lost'
  plan_json       JSONB NOT NULL,
  runner_id       TEXT,
  claimed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS step_events (
  id              TEXT PRIMARY KEY,
  run_id          TEXT NOT NULL REFERENCES runs(id),
  step_index      INTEGER NOT NULL,
  event_type      TEXT NOT NULL,
  payload_json    JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_step_events_run ON step_events(run_id, step_index);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
