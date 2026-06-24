import crypto from 'node:crypto';

/**
 * Generate a typed EntityId with prefix for readability.
 * Format: {prefix}_{8 random hex chars}
 */
export function generateId(prefix: string): string {
  const hex = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${hex}`;
}

export function apiVersionId(): string {
  return generateId('av');
}

export function runId(): string {
  return generateId('run');
}

export function eventId(): string {
  return generateId('evt');
}
