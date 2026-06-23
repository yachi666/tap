/**
 * @sketch-test/adapter-postman — Postman test script assertion extraction
 *
 * Extracts structured AssertionPattern objects from Postman test script
 * events (pm.test / pm.expect calls) using regex pattern matching.
 *
 * Each script line is matched against known patterns. Matched lines
 * produce AssertionPattern objects; unmatched lines are collected into
 * rawScripts[] for downstream consumers.
 *
 * Invariants:
 *  - Only 'test' listen events are processed (prerequest is ignored)
 *  - Disabled events are skipped
 *  - The order of assertions reflects the order of script lines
 *  - rawScripts preserves the original text of unmatched lines (may include
 *    whitespace-only lines, comments, and unrecognized API calls)
 */

import {
  BODY_TEXT_PATTERN,
  EQL_PATTERN,
  HEADER_PATTERN,
  IS_JSON_PATTERN,
  JSON_BODY_PATTERN,
  LATENCY_PATTERN,
  PROPERTY_PATTERN,
  STATUS_ACCEPTED_PATTERN,
  STATUS_CLIENT_ERROR_PATTERN,
  STATUS_CODE_PATTERN,
  STATUS_OK_PATTERN,
} from '../parser/script-patterns.js';
import type { PostmanEvent } from '../types.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * A structured assertion extracted from a Postman test script.
 *
 * Each variant corresponds to a recognised pm.test() / pm.expect() pattern.
 */
export type AssertionPattern =
  | { type: 'status'; equals: number }
  | { type: 'status'; range: string }
  | { type: 'header'; name: string; value: string }
  | { type: 'latency'; max: number }
  | { type: 'body'; jsonPath: string; exists: true }
  | { type: 'body'; jsonPath: string; equals: string }
  | { type: 'body'; contains: string }
  | { type: 'contentType'; isJson: boolean };

export interface AssertionExtractResult {
  assertions: AssertionPattern[];
  rawScripts: string[];
}

// ─── Line Matching ───────────────────────────────────────────────────

/**
 * Attempt to match a single script line against all known patterns.
 *
 * Returns the matched AssertionPattern or null if the line does not
 * match any recognised pattern.
 *
 * More specific patterns are checked before broader ones to avoid
 * false positives.
 */
function matchLine(line: string): AssertionPattern | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Status code exact match: pm.response.to.have.status(N)
  const statusMatch = trimmed.match(STATUS_CODE_PATTERN);
  if (statusMatch) {
    return { type: 'status', equals: Number(statusMatch[1]) };
  }

  // 2. Status range shortcuts (check before general .to.be.{x})
  if (STATUS_OK_PATTERN.test(trimmed)) {
    return { type: 'status', range: '2xx' };
  }
  if (STATUS_ACCEPTED_PATTERN.test(trimmed)) {
    return { type: 'status', equals: 202 };
  }
  if (STATUS_CLIENT_ERROR_PATTERN.test(trimmed)) {
    return { type: 'status', range: '4xx' };
  }

  // 3. Header value check: pm.response.to.have.header("X", "Y")
  const headerMatch = trimmed.match(HEADER_PATTERN);
  if (headerMatch && headerMatch[1] !== undefined && headerMatch[2] !== undefined) {
    return { type: 'header', name: headerMatch[1], value: headerMatch[2] };
  }

  // 4. Latency check: pm.expect(pm.response.responseTime).to.be.below(N)
  const latencyMatch = trimmed.match(LATENCY_PATTERN);
  if (latencyMatch && latencyMatch[1] !== undefined) {
    return { type: 'latency', max: Number(latencyMatch[1]) };
  }

  // 5. JSON body existence: pm.response.to.have.jsonBody("key")
  const jsonBodyMatch = trimmed.match(JSON_BODY_PATTERN);
  if (jsonBodyMatch && jsonBodyMatch[1] !== undefined) {
    return { type: 'body', jsonPath: `$.${jsonBodyMatch[1]}`, exists: true };
  }

  // 6. JSON body equality: pm.expect(jsonData.key).to.eql("value")
  const eqlMatch = trimmed.match(EQL_PATTERN);
  if (eqlMatch && eqlMatch[1] !== undefined && eqlMatch[2] !== undefined) {
    return { type: 'body', jsonPath: `$.${eqlMatch[1]}`, equals: eqlMatch[2] };
  }

  // 7. Property existence: pm.expect(X).to.have.property("key")
  const propertyMatch = trimmed.match(PROPERTY_PATTERN);
  if (propertyMatch && propertyMatch[1] !== undefined) {
    return { type: 'body', jsonPath: `$.${propertyMatch[1]}`, exists: true };
  }

  // 8. Body text match: pm.response.to.have.body("text")
  const bodyTextMatch = trimmed.match(BODY_TEXT_PATTERN);
  if (bodyTextMatch && bodyTextMatch[1] !== undefined) {
    return { type: 'body', contains: bodyTextMatch[1] };
  }

  // 9. Content-type JSON check: pm.response.to.be.json
  if (IS_JSON_PATTERN.test(trimmed)) {
    return { type: 'contentType', isJson: true };
  }

  return null;
}

// ─── Extraction ──────────────────────────────────────────────────────

/**
 * Extract structured assertions from an array of Postman events.
 *
 * Only events with `listen === 'test'` and `disabled !== true` are
 * processed. Each line of the script.exec array is matched against
 * known regex patterns. Matches become AssertionPattern objects;
 * non-matches are preserved in the rawScripts array.
 *
 * @param events - Postman events from a collection item or collection
 * @returns Object containing parsed assertions and raw unmatched scripts
 */
export function extractAssertions(events?: PostmanEvent[]): AssertionExtractResult {
  if (!events || events.length === 0) {
    return { assertions: [], rawScripts: [] };
  }

  const assertions: AssertionPattern[] = [];
  const rawScripts: string[] = [];

  for (const event of events) {
    // Skip disabled events and non-test scripts
    if (event.disabled) continue;
    if (event.listen !== 'test') continue;

    const lines = event.script?.exec;
    if (!lines || lines.length === 0) continue;

    for (const line of lines) {
      const match = matchLine(line);
      if (match) {
        assertions.push(match);
      } else {
        rawScripts.push(line);
      }
    }
  }

  return { assertions, rawScripts };
}
