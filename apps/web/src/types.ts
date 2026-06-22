import type { EntityId, HttpMethod } from '@tap/contracts-common';

// ─── Navigation ─────────────────────────────────────────────────

export type ViewId =
  | 'overview'
  | 'projects'
  | 'workflows'
  | 'apis'
  | 'cases'
  | 'plans'
  | 'environments'
  | 'variables'
  | 'reports'
  | 'agent'
  | 'team'
  | 'trash';

// ─── UI-specific display types ──────────────────────────────────

export type StepTone = 'brown' | 'amber' | 'green' | 'brick' | 'violet';
export type RunState = 'idle' | 'running' | 'passed' | 'failed';

// ─── Business Process (list-level metadata) ─────────────────────

/** Side-effect classification aligned with CONTEXT.md business processes. */
export type SideEffectLevel = 'readonly' | 'cleanable-write' | 'irreversible';

/** A business process item shown in the workflow list view. */
export interface WorkflowMeta {
  id: string;
  /** BP-01 style identifier. */
  bpId: string;
  name: string;
  description: string;
  /** Number of API steps. */
  stepCount: number;
  /** Key variables passed between steps. */
  variableChain: string[];
  /** Side-effect classification. */
  sideEffect: SideEffectLevel;
  /** Category: normal flow or error path. */
  category: 'normal' | 'error-path';
  status: 'healthy' | 'warning' | 'draft';
  lastRun?: string;
  tags: string[];
}

// ─── Workflow Step (UI model — extends contract concepts) ───────

export interface WorkflowStep {
  id: EntityId;
  name: string;
  method: HttpMethod;
  path: string;
  /** UI display: which icon to show. */
  icon: 'user' | 'lock' | 'cart' | 'card' | 'verify';
  /** UI display: color tone for the card. */
  tone: StepTone;
  /** Variable extracted from this step's response. */
  variableName: string;
  /** JSONPath expression for variable extraction. */
  variablePath: string;
  /** Expected HTTP status code. */
  expectedStatus: number;
  /** Assertion expression, e.g. "$.code = 0". */
  assertion: string;
}

// ─── Execution Log (UI model — aligns with RunEvent concepts) ──

export interface ExecutionLog {
  id: EntityId;
  stepId: EntityId;
  name: string;
  method: string;
  path: string;
  status: 'queued' | 'running' | 'passed' | 'failed';
  code?: number;
  duration?: number;
  timestamp?: string;
  message?: string;
}

// ─── API Endpoint (UI model — aligns with CanonicalApiModel) ────

export interface ApiEndpoint {
  id: EntityId;
  method: HttpMethod;
  path: string;
  summary: string;
  coverage: number;
  cases: number;
}

// ─── Test Case (UI model — aligns with TestDefinition) ──────────

/** Source of a test case: OpenAPI spec, AI Agent, or manual authoring. */
export type TestSource = 'OpenAPI' | 'AI Agent' | '手动';

/** Publication status. */
export type TestStatus = '已发布' | '待审核';

export interface TestCase {
  id: EntityId;
  name: string;
  endpoint: string;
  source: TestSource;
  status: TestStatus;
  lastRun: string;
}
