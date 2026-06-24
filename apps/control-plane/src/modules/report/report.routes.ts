import type { FastifyInstance } from 'fastify';
import { sendError } from '../../shared/errors.js';
import { getRunReport } from './report.service.js';

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/runs/:id/report', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await getRunReport(id);
    if (!report) {
      return sendError(reply, 404, 'NOT_FOUND', `Run ${id} not found`);
    }
    reply.send(report);
  });
}
