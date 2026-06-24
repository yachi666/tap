import { pool } from '../../db/db.js';

interface StepEventRow {
  stepIndex: number;
  eventType: string;
  payload: unknown;
  timestamp: string;
}

/** Aggregate run summary with step event details. */
export async function getRunReport(runId: string) {
  const runResult = await pool.query(`SELECT * FROM runs WHERE id = $1`, [runId]);
  if (runResult.rows.length === 0) return null;

  const run = runResult.rows[0];

  const stepEventsResult = await pool.query(
    `SELECT step_index, event_type, payload_json, created_at
     FROM step_events
     WHERE run_id = $1
     ORDER BY step_index, created_at`,
    [runId],
  );

  // Group by step_index
  const stepsMap = new Map<number, StepEventRow[]>();
  for (const evt of stepEventsResult.rows) {
    const idx = evt.step_index;
    if (!stepsMap.has(idx)) stepsMap.set(idx, []);
    stepsMap.get(idx)!.push({
      stepIndex: idx,
      eventType: evt.event_type,
      payload: evt.payload_json,
      timestamp: evt.created_at,
    });
  }

  const steps = Array.from(stepsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([stepIndex, events]) => ({
      stepIndex,
      events,
      status: inferStepStatus(events),
      durationMs: inferStepDuration(events),
    }));

  return {
    run: {
      id: run.id,
      apiVersionId: run.api_version_id,
      status: run.status,
      runnerId: run.runner_id,
      claimedAt: run.claimed_at,
      createdAt: run.created_at,
      finishedAt: run.finished_at,
    },
    steps,
  };
}

function inferStepStatus(events: StepEventRow[]): 'passed' | 'failed' | 'error' | 'unknown' {
  const lastStepFinished = events.filter((e) => e.eventType === 'step.finished').at(-1);
  if (lastStepFinished) {
    const payload = lastStepFinished.payload as Record<string, unknown>;
    return (payload?.['status'] as 'passed' | 'failed' | 'error') ?? 'unknown';
  }
  return 'unknown';
}

function inferStepDuration(events: StepEventRow[]): number | undefined {
  const finished = events.filter((e) => e.eventType === 'step.finished').at(-1);
  if (finished) {
    const payload = finished.payload as Record<string, unknown>;
    return payload?.['totalDurationMs'] as number | undefined;
  }
  return undefined;
}
