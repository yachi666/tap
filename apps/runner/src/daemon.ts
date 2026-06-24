/**
 * Runner Daemon — connects to Control Plane, polls for work, executes plans.
 *
 * This is the standalone Runner process. It:
 * 1. Long-polls CP for pending runs
 * 2. Executes the ExecutionPlan using executePlan()
 * 3. Uploads events after each step
 * 4. Reports final status to CP
 *
 * Usage: npx tsx src/daemon.ts [--runner-id my-runner] [--cp-url http://localhost:3802]
 */

import { executePlan } from './index.js';
import type { ExecutionPlan } from '@sketch-test/runner-protocol';

const CP_URL = process.env['CP_URL'] ?? 'http://localhost:3802';
const RUNNER_ID = process.env['RUNNER_ID'] ?? `runner-${process.pid}`;
const POLL_INTERVAL_MS = 2000;

interface CpRun {
  id: string;
  plan: ExecutionPlan;
}

async function pollForWork(): Promise<CpRun | null> {
  try {
    const response = await fetch(`${CP_URL}/api/runs/next?runnerId=${RUNNER_ID}`);
    if (response.status === 204) return null;
    if (!response.ok) {
      console.error(`[runner] CP returned ${response.status}`);
      return null;
    }
    const data = (await response.json()) as { run: CpRun };
    return data.run;
  } catch (err) {
    console.error(`[runner] Failed to poll CP: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function uploadEvents(
  runId: string,
  events: Array<{
    id: string;
    runId: string;
    stepIndex: number;
    eventType: string;
    payload: unknown;
  }>,
): Promise<void> {
  try {
    const response = await fetch(`${CP_URL}/api/runs/${runId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
    if (!response.ok) {
      console.error(`[runner] Failed to upload events: HTTP ${response.status}`);
    }
  } catch (err) {
    console.error(`[runner] Failed to upload events: ${err instanceof Error ? err.message : err}`);
  }
}

async function reportStatus(runId: string, status: string): Promise<void> {
  try {
    await fetch(`${CP_URL}/api/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, runnerId: RUNNER_ID }),
    });
  } catch (err) {
    console.error(`[runner] Failed to report status: ${err instanceof Error ? err.message : err}`);
  }
}

async function executeRun(run: CpRun): Promise<void> {
  console.log(`[runner] Executing run ${run.id} (${run.plan.steps.length} steps)`);

  const result = await executePlan(run.plan, {
    runId: run.id,
    runnerId: RUNNER_ID,
    runnerVersion: '0.1.0',
  });

  // Build stepId → stepIndex map from the plan
  const stepIndexMap = new Map<string, number>();
  for (let i = 0; i < run.plan.steps.length; i++) {
    stepIndexMap.set(run.plan.steps[i]!.stepId, i);
  }
  stepIndexMap.set('run', -1); // run-level events (run.started, run.finished)

  // Upload events batch, mapping stepId to stepIndex
  const uploadBatch = result.events
    .filter((e) => e.stepId !== 'run') // skip run-level events for step_events table
    .map((e) => ({
      id: `${run.id}-evt-${e.sequence}`,
      runId: run.id,
      stepIndex: stepIndexMap.get(e.stepId) ?? 0,
      eventType: e.eventType,
      payload: e,
    }));

  if (uploadBatch.length > 0) {
    await uploadEvents(run.id, uploadBatch);
  }

  // Report final status
  const status = result.status === 'passed' ? 'passed' : 'failed';
  await reportStatus(run.id, status);

  console.log(
    `[runner] Run ${run.id} completed: ${result.stepsPassed}/${run.plan.steps.length} passed (${result.totalDurationMs}ms)`,
  );
}

async function main(): Promise<void> {
  console.log(`[runner] Daemon starting (runnerId=${RUNNER_ID}, cp=${CP_URL})`);

  while (true) {
    const run = await pollForWork();
    if (run) {
      try {
        await executeRun(run);
      } catch (err) {
        console.error(`[runner] Run ${run.id} failed:`, err);
        await reportStatus(run.id, 'failed');
      }
    }
    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('[runner] Daemon crashed:', err);
  process.exit(1);
});
