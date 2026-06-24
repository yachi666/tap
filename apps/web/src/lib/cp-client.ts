/**
 * Control Plane API client — replaces mock localStorage stores with real HTTP calls.
 *
 * M0 scope: import API specs, create runs, view run reports.
 */

const CP_BASE = 'http://localhost:3802';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${CP_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface ImportResult {
  apiVersionId: string;
  endpointCount: number;
  diagnostics: Array<{ level: string; message: string }>;
}

export interface RunSummary {
  id: string;
  apiVersionId: string;
  status: string;
  runnerId: string | null;
  claimedAt: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface StepRun {
  stepIndex: number;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

export interface RunDetail {
  run: RunSummary;
  steps: StepRun[];
}

export interface RunReport {
  run: RunSummary;
  steps: Array<{
    stepIndex: number;
    status: 'passed' | 'failed' | 'error' | 'unknown';
    durationMs?: number;
    events: Array<{ eventType: string; payload: unknown; timestamp: string }>;
  }>;
}

export const cpClient = {
  importSpec(sourceType: 'file' | 'url', sourceLocation: string): Promise<ImportResult> {
    return request<ImportResult>('/api/import', {
      method: 'POST',
      body: JSON.stringify({ sourceType, sourceLocation }),
    });
  },

  createRun(apiVersionId: string): Promise<{ runId: string; plan: unknown }> {
    return request<{ runId: string; plan: unknown }>(
      `/api/api-versions/${apiVersionId}/execution-plan`,
    );
  },

  createCustomRun(steps: Array<{
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    assertions?: Array<{
      description?: string;
      target: string;
      path?: string;
      operator: string;
      expected?: unknown;
      severity?: string;
    }>;
    extractions?: Array<{
      name: string;
      source: string;
      expression: string;
      sensitive?: boolean;
    }>;
    timeoutMs?: number;
  }>): Promise<{ runId: string; plan: unknown }> {
    return request<{ runId: string; plan: unknown }>('/api/runs', {
      method: 'POST',
      body: JSON.stringify({ steps }),
    });
  },

  listRuns(): Promise<{ runs: RunSummary[] }> {
    return request<{ runs: RunSummary[] }>('/api/runs');
  },

  getRun(runId: string): Promise<RunDetail> {
    return request<RunDetail>(`/api/runs/${runId}`);
  },

  getReport(runId: string): Promise<RunReport> {
    return request<RunReport>(`/api/runs/${runId}/report`);
  },
};
