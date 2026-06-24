import { pool } from '../../db/db.js';
import { eventId } from '../../shared/id.js';

export interface IncomingEvent {
  id?: string;
  runId: string;
  stepIndex: number;
  eventType: string;
  payload: unknown;
}

/**
 * Idempotently insert step events. Events with the same id are skipped.
 * Returns counts of accepted and duplicate events.
 */
export async function insertEvents(
  runId: string,
  events: IncomingEvent[],
): Promise<{ accepted: number; duplicates: number }> {
  let accepted = 0;
  let duplicates = 0;

  for (const evt of events) {
    const id = evt.id ?? eventId();
    try {
      const result = await pool.query(
        `INSERT INTO step_events (id, run_id, step_index, event_type, payload_json)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [id, runId, evt.stepIndex, evt.eventType, JSON.stringify(evt.payload)],
      );
      if ((result.rowCount ?? 0) > 0) {
        accepted++;
      } else {
        duplicates++;
      }
    } catch {
      duplicates++;
    }
  }

  return { accepted, duplicates };
}
