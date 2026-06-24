import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/sketchtest';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

/**
 * Run a migration SQL file. Simple replacement for a migration tool in M0.
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_versions (
        id              TEXT PRIMARY KEY,
        source_type     TEXT NOT NULL,
        source_location TEXT NOT NULL,
        content_hash    TEXT NOT NULL,
        spec_json       JSONB NOT NULL,
        diagnostics     JSONB NOT NULL DEFAULT '[]',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS runs (
        id              TEXT PRIMARY KEY,
        api_version_id  TEXT REFERENCES api_versions(id),
        status          TEXT NOT NULL DEFAULT 'pending',
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
    `);

    // Create indexes (idempotent with IF NOT EXISTS)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_step_events_run ON step_events(run_id, step_index);
      CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
    `);

    console.log('[db] Migrations applied successfully');
  } finally {
    client.release();
  }
}

/**
 * Check database connectivity.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
