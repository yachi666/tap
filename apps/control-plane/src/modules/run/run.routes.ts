import type { FastifyInstance } from 'fastify';
import { pool } from '../../db/db.js';
import { sendError } from '../../shared/errors.js';
import { createFixtureRun, getApiVersion, getRun, listRuns } from './run.service.js';

export async function runRoutes(app: FastifyInstance): Promise<void> {
  /** Generate ExecutionPlan from an API version and create a Run. */
  app.get('/api/api-versions/:id/execution-plan', async (request, reply) => {
    const { id } = request.params as { id: string };
    const apiVersion = await getApiVersion(id);
    if (!apiVersion) {
      return sendError(reply, 404, 'NOT_FOUND', `API version ${id} not found`);
    }

    const { runId, plan } = await createFixtureRun(id);
    reply.send({ runId, plan });
  });

  /** List all runs. */
  app.get('/api/runs', async (_request, reply) => {
    const runs = await listRuns();
    reply.send({ runs });
  });

  /** Get a single run with its step events. */
  app.get('/api/runs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = await getRun(id);
    if (!run) {
      return sendError(reply, 404, 'NOT_FOUND', `Run ${id} not found`);
    }

    const eventsResult = await pool.query(
      `SELECT * FROM step_events WHERE run_id = $1 ORDER BY step_index, created_at`,
      [id],
    );

    reply.send({
      run: {
        id: run.id,
        apiVersionId: run.apiVersionId,
        status: run.status,
        runnerId: run.runnerId,
        claimedAt: run.claimedAt,
        createdAt: run.createdAt,
        finishedAt: run.finishedAt,
      },
      steps: eventsResult.rows.map((e) => ({
        stepIndex: e.step_index,
        eventType: e.event_type,
        payload: e.payload_json,
        createdAt: e.created_at,
      })),
    });
  });
}
