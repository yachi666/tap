import { pool } from '../../db/db.js';

/**
 * Atomically claim the next pending run for a Runner.
 * Uses PostgreSQL FOR UPDATE SKIP LOCKED for concurrency safety.
 */
export async function claimNextRun(
  runnerId: string,
): Promise<{ id: string; plan: unknown } | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT id, plan_json FROM runs
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );

    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }

    const row = result.rows[0];
    await client.query(
      `UPDATE runs SET status = 'claimed', runner_id = $1, claimed_at = now() WHERE id = $2`,
      [runnerId, row.id],
    );

    await client.query('COMMIT');
    return { id: row.id, plan: row.plan_json };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Update run status. Runner calls this when starting and completing. */
export async function updateRunStatus(
  runId: string,
  status: string,
  runnerId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE runs SET status = $1, finished_at = CASE WHEN $1 IN ('passed','failed','cancelled') THEN now() ELSE finished_at END
     WHERE id = $2 AND runner_id = $3`,
    [status, runId, runnerId],
  );
  return (result.rowCount ?? 0) > 0;
}
