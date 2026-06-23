/**
 * @sketch-test/adapter-postman — Folder to workflow hint mapping
 *
 * Produces WorkflowHint objects from the flattened Postman folder structure.
 * Workflow hints describe the intended execution order of endpoints within
 * each folder, enabling downstream workflow compilation.
 *
 * Invariants:
 *  - Items are grouped by their full folder path (folderPath)
 *  - Within each group, endpoint order matches the original collection order
 *  - Items at the root level (empty folderPath) are not included in hints
 *  - Hints are ordered by their first appearance in the flat items list
 */

import type { PostmanUrl } from '../types.js';
import type { FlatItem } from './endpoints.js';
import { buildPath } from './endpoints.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * A workflow hint describing a group of endpoints from a single folder.
 *
 * The `name` is the folder's full path (parent folder names joined by " / ").
 * The `steps` array contains endpoint IDs in their original document order.
 */
export interface WorkflowHint {
  name: string;
  steps: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Compute an endpoint ID from a PostmanItem the same way mapToEndpoint does.
 *
 * ID format: {METHOD}-{normalizedPath}
 * Example: "GET-/users/:userId"
 */
function computeEndpointId(item: {
  request?: { method: string; url: PostmanUrl | string };
}): string | null {
  if (!item.request) return null;
  const method = item.request.method.toUpperCase();
  const rawPath = buildPath(item.request.url);
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${method}-${normalizedPath}`;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Map a flattened item list into workflow hints grouped by folder.
 *
 * Each unique folderPath produces one WorkflowHint. Items within a hint
 * are ordered by their position in the input array.
 *
 * @param flatItems - The output of flattenItems()
 * @returns Array of workflow hints ordered by first folder appearance
 */
export function mapWorkflowHints(flatItems: FlatItem[]): WorkflowHint[] {
  const folderMap = new Map<string, string[]>();

  for (const flat of flatItems) {
    if (!flat.folderPath) continue; // skip root-level items

    const endpointId = computeEndpointId(flat.item);
    if (!endpointId) continue; // skip items without a request

    const steps = folderMap.get(flat.folderPath);
    if (steps) {
      steps.push(endpointId);
    } else {
      folderMap.set(flat.folderPath, [endpointId]);
    }
  }

  // Preserve insertion order for hints
  const hints: WorkflowHint[] = [];
  for (const [name, steps] of folderMap) {
    hints.push({ name, steps });
  }

  return hints;
}
