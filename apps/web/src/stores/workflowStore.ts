import { create } from 'zustand';
import { initialLogs, initialSteps, makeLogs, workflowStepsMap, workflows } from '../data';
import {
  LS_ACTIVE_WORKFLOW_KEY,
  LS_WORKFLOW_KEY,
  lsGet,
  lsGetJSON,
  lsSet,
  lsSetJSON,
} from '../lib/storage';
import type { ExecutionLog, RunState, WorkflowStep } from '../types';

interface WorkflowState {
  activeWorkflowId: string | null;
  steps: WorkflowStep[];
  selectedId: string;
  logs: ExecutionLog[];
  runState: RunState;
  runningRef: { current: boolean };

  setActiveWorkflowId: (id: string | null) => void;
  setSteps: (stepsOrUpdater: WorkflowStep[] | ((prev: WorkflowStep[]) => WorkflowStep[])) => void;
  setSelectedId: (id: string) => void;
  setLogs: (updater: ExecutionLog[] | ((prev: ExecutionLog[]) => ExecutionLog[])) => void;
  setRunState: (state: RunState) => void;
  openWorkflow: (workflowId: string) => void;
  backToList: () => void;
  saveDraft: () => void;
  runWorkflow: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeWorkflowId: (() => {
    try {
      const stored = lsGet(LS_ACTIVE_WORKFLOW_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return null;
  })(),

  steps: lsGetJSON<WorkflowStep[]>(LS_WORKFLOW_KEY, initialSteps, (parsed) =>
    Array.isArray(parsed) &&
    parsed.length > 0 &&
    parsed.every((s) => s && typeof s === 'object' && 'id' in s)
      ? (parsed as WorkflowStep[])
      : null,
  ),

  selectedId: (() => {
    try {
      const stored = lsGet(LS_WORKFLOW_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0] as Record<string, unknown>;
          if (first && typeof first['id'] === 'string') return first['id'];
        }
      }
    } catch {
      // ignore
    }
    return initialSteps[2].id;
  })(),

  logs: initialLogs,
  runState: 'idle' as RunState,
  runningRef: { current: false },

  setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),
  setSteps: (stepsOrUpdater) =>
    set((state) => ({
      steps:
        typeof stepsOrUpdater === 'function'
          ? (stepsOrUpdater as (prev: WorkflowStep[]) => WorkflowStep[])(state.steps)
          : stepsOrUpdater,
    })),
  setSelectedId: (id) => set({ selectedId: id }),
  setLogs: (updater) =>
    set((state) => ({
      logs: typeof updater === 'function' ? updater(state.logs) : updater,
    })),
  setRunState: (runState) => set({ runState }),

  openWorkflow: (workflowId: string) => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    const wfSteps = workflowStepsMap[workflowId] ?? initialSteps;
    set({
      activeWorkflowId: workflowId,
      steps: wfSteps,
      selectedId: wfSteps[0].id,
      logs: makeLogs(wfSteps),
      runState: 'idle',
    });
  },

  backToList: () => {
    set({ activeWorkflowId: null, runState: 'idle' });
  },

  saveDraft: () => {
    const { steps, activeWorkflowId } = get();
    lsSetJSON(LS_WORKFLOW_KEY, steps);
    lsSet(LS_ACTIVE_WORKFLOW_KEY, activeWorkflowId ?? '');
  },

  runWorkflow: async () => {
    const { runningRef, steps } = get();
    if (runningRef.current) return;
    runningRef.current = true;

    set({ runState: 'running' });
    set((state) => ({
      logs: state.logs.map((log) => ({ ...log, status: 'queued' })),
    }));

    const currentSteps = steps;
    for (let index = 0; index < currentSteps.length; index += 1) {
      const step = currentSteps[index];
      set({ selectedId: step.id });
      set((state) => ({
        logs: state.logs.map((log) =>
          log.stepId === step.id
            ? {
                ...log,
                status: 'running',
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
              }
            : log,
        ),
      }));
      await sleep(520 + index * 90);
      const failed = index === currentSteps.length - 1;
      set((state) => ({
        logs: state.logs.map((log) =>
          log.stepId === step.id
            ? {
                ...log,
                status: failed ? 'failed' : 'passed',
                code: 200,
                duration: [320, 280, 310, 450, 210][index] ?? 280,
                message: failed ? '断言失败：订单状态仍为"待支付"' : '',
              }
            : log,
        ),
      }));
    }
    set({ runState: 'failed' });
    runningRef.current = false;
  },
}));
