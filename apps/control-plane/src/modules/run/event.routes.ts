import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendError } from '../../shared/errors.js';
import { insertEvents } from './event.service.js';

const EventsBodySchema = z.object({
  events: z.array(
    z.object({
      id: z.string().optional(),
      runId: z.string().min(1),
      stepIndex: z.number().int().nonnegative(),
      eventType: z.string().min(1),
      payload: z.unknown(),
    }),
  ),
});

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  /** Runner uploads batch of step events. */
  app.post('/api/runs/:id/events', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = EventsBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'INVALID_INPUT', 'Invalid events payload', [
        { field: 'body', message: parsed.error.message },
      ]);
    }

    const { accepted, duplicates } = await insertEvents(
      id,
      parsed.data.events.map((e) => ({
        id: e.id,
        runId: e.runId,
        stepIndex: e.stepIndex,
        eventType: e.eventType,
        payload: e.payload,
      })),
    );
    reply.status(201).send({ accepted, duplicates });
  });
}
