/**
 * workflowStore unit tests.
 *
 * Tests workflow CRUD, runWorkflow, and CP integration.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ─── Mock cpClient ─────────────────────────────────────────────────

const { mockCreateCustomRun, mockGetRun, mockListWorkflows } = vi.hoisted(() => ({
  mockCreateCustomRun: vi.fn(),
  mockGetRun: vi.fn(),
  mockListWorkflows: vi.fn(),
}));

vi.mock('../../lib/cp-client', () => ({
  cpClient: {
    createCustomRun: (...args: unknown[]) => mockCreateCustomRun(...args),
    getRun: (...args: unknown[]) => mockGetRun(...args),
    listWorkflows: (...args: unknown[]) => mockListWorkflows(...args),
  },
}));

// ─── Mock storage lib ──────────────────────────────────────────────

const { mockLsGet, mockLsGetJSON, mockLsSet, mockLsSetJSON } = vi.hoisted(() => ({
  mockLsGet: vi.fn(),
  mockLsGetJSON: vi.fn(),
  mockLsSet: vi.fn(),
  mockLsSetJSON: vi.fn(),
}));

vi.mock('../../lib/storage', () => ({
  lsGet: (...args: unknown[]) => mockLsGet(...args),
  lsGetJSON: (...args: unknown[]) => mockLsGetJSON(...args),
  lsSet: (...args: unknown[]) => mockLsSet(...args),
  lsSetJSON: (...args: unknown[]) => mockLsSetJSON(...args),
  LS_WORKFLOW_KEY: 'sketchtest.workflow:v1',
  LS_ACTIVE_WORKFLOW_KEY: 'sketchtest.active-workflow:v1',
}));

// ─── Mock data ─────────────────────────────────────────────────────

import type { WorkflowStep, ExecutionLog } from '../../types';

const { mockInitialSteps, mockTestStep, mockTestStep2 } = vi.hoisted(() => {
  const testStep: WorkflowStep = {
    id: 'step-1',
    name: 'Get Users',
    method: 'GET',
    path: '/users',
    icon: 'user',
    tone: 'green',
    variableName: 'userId',
    variablePath: '$.data.id',
    expectedStatus: 200,
    assertion: '$.id exists',
  };

  const testStep2: WorkflowStep = {
    id: 'step-2',
    name: 'Create User',
    method: 'POST',
    path: '/users',
    icon: 'user',
    tone: 'green',
    variableName: '',
    variablePath: '',
    expectedStatus: 201,
    assertion: '',
  };

  return {
    mockInitialSteps: [testStep, testStep2, { ...testStep, id: 'step-3', name: 'Get User', path: '/users/1' }],
    mockTestStep: testStep,
    mockTestStep2: testStep2,
  };
});

const testStep = mockTestStep;
const testStep2 = mockTestStep2;

vi.mock('../../data', () => ({
  initialSteps: mockInitialSteps,
  initialLogs: [] as ExecutionLog[],
  workflows: [{ id: 'wf-default', name: 'Default Workflow' }],
  workflowStepsMap: {} as Record<string, WorkflowStep[]>,
  makeLogs: () => [] as ExecutionLog[],
}));

import { useWorkflowStore } from '../workflowStore';

// ─── Tests ─────────────────────────────────────────────────────────

describe('workflowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLsGet.mockReturnValue(null);
    mockLsGetJSON.mockReturnValue([]);

    useWorkflowStore.setState({
      activeWorkflowId: null,
      steps: [],
      selectedId: '',
      logs: [],
      runState: 'idle',
      currentRunId: null,
      cpWorkflows: [],
      loading: false,
      error: null,
    } as any);

    useWorkflowStore.getState().runningRef.current = false;
  });

  describe('setActiveWorkflowId', () => {
    test('sets and clears active workflow ID', () => {
      useWorkflowStore.getState().setActiveWorkflowId('wf-123');
      expect(useWorkflowStore.getState().activeWorkflowId).toBe('wf-123');

      useWorkflowStore.getState().setActiveWorkflowId(null);
      expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();
    });
  });

  describe('setSteps', () => {
    test('replaces steps with array', () => {
      useWorkflowStore.getState().setSteps([testStep]);
      expect(useWorkflowStore.getState().steps).toHaveLength(1);
    });

    test('supports updater function', () => {
      useWorkflowStore.setState({ steps: [testStep] } as any);
      useWorkflowStore.getState().setSteps((prev) => [...prev, testStep2]);
      expect(useWorkflowStore.getState().steps).toHaveLength(2);
    });
  });

  describe('setSelectedId', () => {
    test('sets selected step ID', () => {
      useWorkflowStore.getState().setSelectedId('step-2');
      expect(useWorkflowStore.getState().selectedId).toBe('step-2');
    });
  });

  describe('setRunState', () => {
    test('sets run state', () => {
      for (const state of ['idle', 'running', 'passed', 'failed'] as const) {
        useWorkflowStore.getState().setRunState(state);
        expect(useWorkflowStore.getState().runState).toBe(state);
      }
    });
  });

  describe('openWorkflow', () => {
    test('opens a workflow by ID', () => {
      useWorkflowStore.getState().openWorkflow('wf-default');
      const state = useWorkflowStore.getState();
      expect(state.activeWorkflowId).toBe('wf-default');
      expect(state.steps.length).toBeGreaterThan(0);
      expect(state.runState).toBe('idle');
    });
  });

  describe('backToList', () => {
    test('clears active workflow and resets run state', () => {
      useWorkflowStore.setState({ activeWorkflowId: 'wf-1', runState: 'failed' } as any);
      useWorkflowStore.getState().backToList();
      expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();
      expect(useWorkflowStore.getState().runState).toBe('idle');
    });
  });

  describe('saveDraft', () => {
    test('persists to storage', () => {
      useWorkflowStore.setState({
        activeWorkflowId: 'wf-x',
        steps: [testStep],
      } as any);

      useWorkflowStore.getState().saveDraft();
      expect(mockLsSetJSON).toHaveBeenCalled();
    });
  });

  describe('runWorkflow', () => {
    test('creates a run and resolves as passed', async () => {
      useWorkflowStore.setState({ steps: [testStep] } as any);

      mockCreateCustomRun.mockResolvedValue({ runId: 'run-001' });
      mockGetRun.mockResolvedValue({
        run: { id: 'run-001', status: 'passed' },
        steps: [{ stepIndex: 0, eventType: 'step.finished', payload: { status: 'passed' } }],
      });

      await useWorkflowStore.getState().runWorkflow();

      expect(useWorkflowStore.getState().runState).toBe('passed');
      expect(useWorkflowStore.getState().currentRunId).toBe('run-001');
    });

    test('resolves as failed when run status is failed', async () => {
      useWorkflowStore.setState({ steps: [testStep] } as any);

      mockCreateCustomRun.mockResolvedValue({ runId: 'run-001' });
      mockGetRun.mockResolvedValue({
        run: { id: 'run-001', status: 'failed' },
        steps: [],
      });

      await useWorkflowStore.getState().runWorkflow();

      expect(useWorkflowStore.getState().runState).toBe('failed');
    });

    test('handles createCustomRun error gracefully', async () => {
      useWorkflowStore.setState({ steps: [testStep] } as any);
      mockCreateCustomRun.mockRejectedValue(new Error('Network error'));

      await useWorkflowStore.getState().runWorkflow();
      expect(useWorkflowStore.getState().runState).toBe('failed');
    });

    test('prevents concurrent runs', async () => {
      useWorkflowStore.getState().runningRef.current = true;
      await useWorkflowStore.getState().runWorkflow();
      expect(mockCreateCustomRun).not.toHaveBeenCalled();
    });
  });

  describe('fetchWorkflowsFromServer', () => {
    test('fetches workflows from CP', async () => {
      mockListWorkflows.mockResolvedValue({ workflows: [{ id: 'cp-wf-1', name: 'CP Workflow' }] });

      await useWorkflowStore.getState().fetchWorkflowsFromServer('ws-001');

      const state = useWorkflowStore.getState();
      expect(state.cpWorkflows).toHaveLength(1);
      expect(state.loading).toBe(false);
    });

    test('sets error on failure', async () => {
      mockListWorkflows.mockRejectedValue(new Error('API down'));

      await useWorkflowStore.getState().fetchWorkflowsFromServer('ws-001');

      expect(useWorkflowStore.getState().error).toContain('API down');
    });
  });
});
