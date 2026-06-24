/**
 * @sketch-test/control-plane — M0 Skeleton API Server
 *
 * Minimal Fastify server proving the end-to-end vertical slice:
 * Import → Compile → Runner Execute → Evidence Report.
 *
 * Invariants:
 * - Runner and Web are separate processes; CP is their only shared contract.
 * - No auth in M0 — everything runs on localhost.
 * - Database: PostgreSQL via `pg` (no ORM).
 */

import Fastify from 'fastify';
import { runMigrations } from './db/db.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { importRoutes } from './modules/import/import.routes.js';
import { runRoutes } from './modules/run/run.routes.js';
import { leaseRoutes } from './modules/run/lease.routes.js';
import { eventRoutes } from './modules/run/event.routes.js';
import { reportRoutes } from './modules/report/report.routes.js';

const PORT = parseInt(process.env['CP_PORT'] ?? '3802', 10);
const HOST = process.env['CP_HOST'] ?? '0.0.0.0';

async function main(): Promise<void> {
  // Run database migrations
  await runMigrations();

  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  });

  // Register routes
  await healthRoutes(app);
  await importRoutes(app);
  await runRoutes(app);
  await leaseRoutes(app);
  await eventRoutes(app);
  await reportRoutes(app);

  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`[control-plane] Listening on http://${HOST}:${PORT}`);
    console.log(`[control-plane] Health check: http://localhost:${PORT}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
