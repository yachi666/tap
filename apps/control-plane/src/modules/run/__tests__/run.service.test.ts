/**
 * Run service unit tests.
 *
 * Tests ExecutionPlan building and step transformation logic.
 * No database dependency — tests pure data transformations.
 */
import { describe, expect, test } from 'vitest';
import { buildFixturePlan, createRunFromSteps } from '../run.service';
import type { ExecutionPlan } from '@sketch-test/runner-protocol';

// ─── buildFixturePlan ─────────────────────────────────────────────

describe('buildFixturePlan', () => {
  test('returns a valid ExecutionPlan structure', () => {
    const plan = buildFixturePlan('api-v1');

    expect(plan.schemaVersion).toBe('sketch-test.runner-protocol/v1');
    expect(plan.planId).toBeTruthy();
    expect(plan.planHash).toHaveLength(64);
    expect(plan.workflowVersionId).toBe('api-v1');
    expect(plan.compiledAt).toBeTruthy();
  });

  test('produces exactly 5 steps', () => {
    const plan = buildFixturePlan('api-v1');
    expect(plan.steps).toHaveLength(5);
  });

  test('steps have sequential ordering', () => {
    const plan = buildFixturePlan('api-v1');
    plan.steps.forEach((step, i) => {
      expect(step.sequence).toBe(i);
    });
  });

  test('step IDs are unique', () => {
    const plan = buildFixturePlan('api-v1');
    const ids = plan.steps.map((s) => s.stepId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all steps have maxRetries=0 and retryOnNetworkError=false', () => {
    const plan = buildFixturePlan('api-v1');
    for (const step of plan.steps) {
      expect(step.maxRetries).toBe(0);
      expect(step.retryOnNetworkError).toBe(false);
    }
  });

  test('all steps are enabled', () => {
    const plan = buildFixturePlan('api-v1');
    for (const step of plan.steps) {
      expect(step.enabled).toBe(true);
    }
  });

  test('all steps have onFailure=stop', () => {
    const plan = buildFixturePlan('api-v1');
    for (const step of plan.steps) {
      expect(step.onFailure).toBe('stop');
    }
  });

  test('step 0 is login with accessToken extraction', () => {
    const plan = buildFixturePlan('api-v1');
    const step0 = plan.steps[0]!;

    expect(step0.method).toBe('POST');
    expect(step0.urlTemplate).toContain('/api/auth/login');
    expect(step0.sideEffect).toBe('read-only');

    // Has status assertion
    expect(step0.assertions.some((a) => a.target === 'status')).toBe(true);

    // Extracts accessToken as sensitive
    const extraction = step0.extractions?.find((e) => e.name === 'accessToken');
    expect(extraction).toBeDefined();
    expect(extraction!.sensitive).toBe(true);
    expect(extraction!.scope).toBe('workflow');
  });

  test('step 1 creates user with userId extraction', () => {
    const plan = buildFixturePlan('api-v1');
    const step1 = plan.steps[1]!;

    expect(step1.method).toBe('POST');
    expect(step1.urlTemplate).toContain('/api/users');
    expect(step1.sideEffect).toBe('cleanup-required');

    const extraction = step1.extractions?.find((e) => e.name === 'userId');
    expect(extraction).toBeDefined();
    expect(extraction!.sensitive).toBe(false);
  });

  test('step 2 verifies user with variable reference', () => {
    const plan = buildFixturePlan('api-v1');
    const step2 = plan.steps[2]!;

    expect(step2.method).toBe('GET');
    expect(step2.urlTemplate).toContain('${userId}');
    expect(step2.sideEffect).toBe('read-only');
    expect(step2.extractions).toHaveLength(0);
  });

  test('step 3 creates order with auth header and orderId extraction', () => {
    const plan = buildFixturePlan('api-v1');
    const step3 = plan.steps[3]!;

    expect(step3.method).toBe('POST');
    expect(step3.urlTemplate).toContain('/api/orders');
    expect(step3.headers).toHaveProperty('Authorization');
    expect(step3.headers!['Authorization']).toContain('${accessToken}');
    expect(step3.sideEffect).toBe('cleanup-required');

    const extraction = step3.extractions?.find((e) => e.name === 'orderId');
    expect(extraction).toBeDefined();
  });

  test('step 4 verifies order status', () => {
    const plan = buildFixturePlan('api-v1');
    const step4 = plan.steps[4]!;

    expect(step4.method).toBe('GET');
    expect(step4.urlTemplate).toContain('${orderId}');
    expect(step4.sideEffect).toBe('read-only');

    // Verify the assertion checks for 待支付 status
    const statusAssertion = step4.assertions.find((a) => a.path === '$.data.status');
    expect(statusAssertion).toBeDefined();
    expect(statusAssertion!.expected).toBe('待支付');
  });

  test('each plan gets a unique planId', () => {
    const plan1 = buildFixturePlan('api-v1');
    const plan2 = buildFixturePlan('api-v2');

    expect(plan1.planId).not.toBe(plan2.planId);
  });

  test('step assertions have unique IDs within each step', () => {
    const plan = buildFixturePlan('api-v1');
    for (const step of plan.steps) {
      const assertionIds = step.assertions.map((a) => a.id);
      expect(new Set(assertionIds).size).toBe(assertionIds.length);
    }
  });
});

// ─── createRunFromSteps ──────────────────────────────────────────

describe('createRunFromSteps', () => {
  test('returns a valid ExecutionPlan with correct schema version', () => {
    const result = createRunFromSteps([
      { method: 'GET', url: 'https://example.com/api/test', timeoutMs: 5000 },
    ]);

    expect(result.plan.schemaVersion).toBe('sketch-test.runner-protocol/v1');
    expect(result.plan.planId).toBeTruthy();
    expect(result.runId).toBe(result.plan.planId);
  });

  test('maps step count correctly', () => {
    const steps = [
      { method: 'GET', url: 'https://a.com/1', timeoutMs: 5000 },
      { method: 'POST', url: 'https://a.com/2', timeoutMs: 5000 },
      { method: 'DELETE', url: 'https://a.com/3', timeoutMs: 5000 },
    ];

    const result = createRunFromSteps(steps);
    expect(result.plan.steps).toHaveLength(3);
  });

  test('maps method correctly', () => {
    const result = createRunFromSteps([
      { method: 'PATCH', url: 'https://example.com/api', timeoutMs: 5000 },
    ]);

    expect(result.plan.steps[0]!.method).toBe('PATCH');
  });

  test('maps headers', () => {
    const result = createRunFromSteps([
      {
        method: 'GET',
        url: 'https://example.com/api',
        headers: { Authorization: 'Bearer token', 'X-Custom': 'value' },
        timeoutMs: 5000,
      },
    ]);

    expect(result.plan.steps[0]!.headers).toEqual({
      Authorization: 'Bearer token',
      'X-Custom': 'value',
    });
  });

  test('maps body', () => {
    const result = createRunFromSteps([
      {
        method: 'POST',
        url: 'https://example.com/api',
        body: { name: 'test', value: 42 },
        timeoutMs: 5000,
      },
    ]);

    expect(result.plan.steps[0]!.body).toEqual({ name: 'test', value: 42 });
  });

  test('maps assertions with correct IDs', () => {
    const result = createRunFromSteps([
      {
        method: 'GET',
        url: 'https://example.com/api',
        assertions: [
          { target: 'status', operator: 'equals', expected: 200, severity: 'block' },
          { target: 'jsonPath', path: '$.data.id', operator: 'exists', severity: 'block' },
        ],
        timeoutMs: 5000,
      },
    ]);

    const step0 = result.plan.steps[0]!;
    expect(step0.assertions).toHaveLength(2);
    expect(step0.assertions[0]!.target).toBe('status');
    expect(step0.assertions[0]!.severity).toBe('block');
    expect(step0.assertions[1]!.path).toBe('$.data.id');

    // IDs are unique
    expect(step0.assertions[0]!.id).not.toBe(step0.assertions[1]!.id);
  });

  test('maps assertions with default severity when omitted', () => {
    const result = createRunFromSteps([
      {
        method: 'GET',
        url: 'https://example.com/api',
        assertions: [
          { target: 'status', operator: 'equals', expected: 200, severity: 'block' } as const,
        ],
        timeoutMs: 5000,
      },
    ]);

    expect(result.plan.steps[0]!.assertions[0]!.severity).toBe('block');
  });

  test('maps extractions with correct scope', () => {
    const result = createRunFromSteps([
      {
        method: 'POST',
        url: 'https://example.com/login',
        assertions: [],
        extractions: [
          { name: 'token', source: 'body', expression: '$.data.token', sensitive: true },
          { name: 'userId', source: 'body', expression: '$.data.id', sensitive: false },
        ],
        timeoutMs: 5000,
      },
    ]);

    const exts = result.plan.steps[0]!.extractions!;
    expect(exts).toHaveLength(2);
    expect(exts[0]!.name).toBe('token');
    expect(exts[0]!.sensitive).toBe(true);
    expect(exts[1]!.sensitive).toBe(false);

    // All extractions are workflow-scoped
    for (const ext of exts) {
      expect(ext['scope']).toBe('workflow');
    }
  });

  test('handles empty assertions and extractions', () => {
    const result = createRunFromSteps([
      { method: 'GET', url: 'https://example.com/api', timeoutMs: 5000 },
    ]);

    expect(result.plan.steps[0]!.assertions).toHaveLength(0);
    expect(result.plan.steps[0]!.extractions).toHaveLength(0);
  });

  test('all steps have onFailure=stop', () => {
    const result = createRunFromSteps([
      { method: 'GET', url: 'https://a.com', timeoutMs: 5000 },
      { method: 'POST', url: 'https://b.com', timeoutMs: 5000 },
    ]);

    for (const step of result.plan.steps) {
      expect(step.onFailure).toBe('stop');
    }
  });

  test('all steps are enabled with read-only sideEffect', () => {
    const result = createRunFromSteps([{ method: 'GET', url: 'https://a.com', timeoutMs: 5000 }]);

    expect(result.plan.steps[0]!.enabled).toBe(true);
    expect(result.plan.steps[0]!.sideEffect).toBe('read-only');
  });

  test('uses default timeoutMs=30000 when not specified', () => {
    const result = createRunFromSteps([
      { method: 'GET', url: 'https://a.com' } as Parameters<typeof createRunFromSteps>[0][0],
    ]);

    expect(result.plan.steps[0]!.timeoutMs).toBe(30000);
  });

  test('preserves specified timeoutMs', () => {
    const result = createRunFromSteps([{ method: 'GET', url: 'https://a.com', timeoutMs: 60000 }]);

    expect(result.plan.steps[0]!.timeoutMs).toBe(60000);
  });

  test('step sequence numbers are 0-indexed', () => {
    const steps = Array.from({ length: 10 }, (_, i) => ({
      method: 'GET' as const,
      url: `https://example.com/step${i}`,
      timeoutMs: 5000,
    }));

    const result = createRunFromSteps(steps);
    result.plan.steps.forEach((step, i) => {
      expect(step.sequence).toBe(i);
    });
  });

  test('step IDs contain planId prefix', () => {
    const result = createRunFromSteps([
      { method: 'GET', url: 'https://example.com/api', timeoutMs: 5000 },
    ]);

    const id = result.plan.steps[0]!.stepId;
    expect(id).toContain(result.plan.planId);
    expect(id).toContain('-step-0');
  });

  test('each run gets a unique planId', () => {
    const r1 = createRunFromSteps([{ method: 'GET', url: 'https://a.com', timeoutMs: 5000 }]);
    const r2 = createRunFromSteps([{ method: 'GET', url: 'https://b.com', timeoutMs: 5000 }]);

    expect(r1.runId).not.toBe(r2.runId);
    expect(r1.plan.planId).not.toBe(r2.plan.planId);
  });
});
