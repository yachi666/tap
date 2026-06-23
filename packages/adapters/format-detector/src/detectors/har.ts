import type { DetectionResult } from '../index.js';

export function detectHar(content: unknown): DetectionResult | null {
  if (!content || typeof content !== 'object') return null;

  const obj = content as Record<string, unknown>;
  const log = obj['log'];

  if (!log || typeof log !== 'object') return null;

  const entries = (log as Record<string, unknown>)['entries'];

  if (Array.isArray(entries) && entries.length > 0) {
    return {
      format: 'har',
      confidence: 0.95,
      label: 'HAR (HTTP Archive)',
      details: {
        endpointCount: entries.length,
      },
    };
  }

  return null;
}
