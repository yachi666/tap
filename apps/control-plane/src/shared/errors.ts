import type { FastifyReply } from 'fastify';

export interface ApiError {
  code: string;
  message: string;
  fieldProblems?: Array<{ field: string; message: string }>;
  correlationId: string;
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  fieldProblems?: Array<{ field: string; message: string }>,
): void {
  reply.status(statusCode).send({
    code,
    message,
    fieldProblems,
    correlationId: crypto.randomUUID(),
  } satisfies ApiError);
}

import crypto from 'node:crypto';
