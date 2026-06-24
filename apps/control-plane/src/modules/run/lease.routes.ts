import type { FastifyInstance } from 'fastify';
import { sendError } from '../../shared/errors.js';
import { claimNextRun, updateRunStatus } from './lease.service.js';

export async function leaseRoutes(app: FastifyInstance): Promise<void> {
  /** Runner polls for the next pending run. Long-poll: waits up to 30s. */
  app.get('/api/runs/next', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const runnerId = query['runnerId'] ?? 'anonymous';

    // Simple polling with timeout (30s loop with 1s interval)
    const deadline = Date.now() + 30_000;

    while (Date.now() < deadline) {
      const claimed = await claimNextRun(runnerId);
      if (claimed) {
        return reply.send({ run: { id: claimed.id, plan: claimed.plan } });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    reply.status(204).send();
  });

  /** Runner explicitly claims a specific run. */
  app.put('/api/runs/:id/claim', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { runnerId?: string };
    const runnerId = body?.runnerId ?? 'anonymous';

    const claimed = await claimNextRun(runnerId);
    if (!claimed || claimed.id !== id) {
      return sendError(reply, 409, 'ALREADY_CLAIMED', `Run ${id} is not available`);
    }

    reply.send({ claimed: true, runId: id });
  });

  /** Runner updates run status. */
  app.patch('/api/runs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string; runnerId?: string };
    if (!body.status || !body.runnerId) {
      return sendError(reply, 400, 'INVALID_INPUT', 'status and runnerId are required');
    }

    const ok = await updateRunStatus(id, body.status, body.runnerId);
    if (!ok) {
      return sendError(reply, 404, 'NOT_FOUND', `Run ${id} not found or not owned by this runner`);
    }

    reply.send({ updated: true });
  });
}
