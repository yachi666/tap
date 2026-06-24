/**
 * runStore unit tests.
 *
 * Tests run fetching, polling, and active run selection.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ─── Mock cpClient ──────────────────────────────────────────────────

const mockListRuns = vi.fn();
const mockGetRun = vi.fn();

vi.mock('../../lib/cp-client', () => ({
  cpClient: {
    listRuns: (...args: unknown[]) => mockListRuns(...args),
    getRun: (...args: unknown[]) => mockGetRun(...args),
  },
}));

import { useRunStore } from '../runStore';
import type { RunSummary } from '../../lib/cp-client';

// ─── Tests ──────────────────────────────────────────────────────────

describe('runStore', () => {
  beforeEach(() => {
    mockListRuns.mockReset();
    mockGetRun.mockReset();
    useRunStore.setState({
      runs: [],
      activeRunId: null,
      loading: false,
      error: null,
    });
  });

  // ── Active run ──────────────────────────────────────────────

  describe('setActiveRunId', () => {
    test('sets active run id', () => {
      useRunStore.getState().setActiveRunId('run-123');
      expect(useRunStore.getState().activeRunId).toBe('run-123');
    });

    test('clears active run id with null', () => {
      useRunStore.getState().setActiveRunId('run-123');
      useRunStore.getState().setActiveRunId(null);
      expect(useRunStore.getState().activeRunId).toBeNull();
    });
  });

  // ── fetchRuns ───────────────────────────────────────────────

  describe('fetchRuns', () => {
    test('sets loading=true during fetch', () => {
      mockListRuns.mockImplementation(() => new Promise((r) => setTimeout(r, 100)));
      useRunStore.getState().fetchRuns();
      expect(useRunStore.getState().loading).toBe(true);
    });

    test('on success populates runs', async () => {
      const mockRuns: RunSummary[] = [
        {
          id: 'run-1',
          apiVersionId: 'av-1',
          status: 'passed',
          runnerId: 'runner-1',
          claimedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          finishedAt: '2026-01-01T00:00:01Z',
        },
        {
          id: 'run-2',
          apiVersionId: 'av-1',
          status: 'failed',
          runnerId: null,
          claimedAt: null,
          createdAt: '2026-01-01T00:00:02Z',
          finishedAt: null,
        },
      ];
      mockListRuns.mockResolvedValue({ runs: mockRuns });

      await useRunStore.getState().fetchRuns();

      const state = useRunStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.runs).toHaveLength(2);
      expect(state.runs[0]!.status).toBe('passed');
      expect(state.runs[1]!.status).toBe('failed');
    });

    test('passes status filter to API', async () => {
      mockListRuns.mockResolvedValue({ runs: [] });

      await useRunStore.getState().fetchRuns('running');

      expect(mockListRuns).toHaveBeenCalledWith('running');
    });

    test('calls API without filter when no status provided', async () => {
      mockListRuns.mockResolvedValue({ runs: [] });

      await useRunStore.getState().fetchRuns();

      expect(mockListRuns).toHaveBeenCalledWith(undefined);
    });

    test('on failure sets error and clears loading', async () => {
      mockListRuns.mockRejectedValue(new Error('Connection refused'));

      await useRunStore.getState().fetchRuns();

      const state = useRunStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toContain('Connection refused');
      expect(state.runs).toHaveLength(0);
    });

    test('empty runs list is valid', async () => {
      mockListRuns.mockResolvedValue({ runs: [] });

      await useRunStore.getState().fetchRuns();

      expect(useRunStore.getState().runs).toHaveLength(0);
      expect(useRunStore.getState().error).toBeNull();
    });
  });

  // ── pollRun ─────────────────────────────────────────────────

  describe('pollRun', () => {
    test('returns immediately when status is terminal (passed)', async () => {
      const terminalRun: RunSummary = {
        id: 'run-done',
        apiVersionId: 'av-1',
        status: 'passed',
        runnerId: null,
        claimedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
        finishedAt: '2026-01-01T00:00:01Z',
      };
      mockGetRun.mockResolvedValue({ run: terminalRun, steps: [] });

      const result = await useRunStore.getState().pollRun('run-done', 5000);

      expect(result.status).toBe('passed');
      expect(mockGetRun).toHaveBeenCalledTimes(1);
    });

    test('returns immediately when status is failed', async () => {
      mockGetRun.mockResolvedValue({
        run: {
          id: 'run-fail',
          apiVersionId: 'av-1',
          status: 'failed',
          runnerId: null,
          claimedAt: null,
          createdAt: '',
          finishedAt: null,
        },
        steps: [],
      });

      const result = await useRunStore.getState().pollRun('run-fail', 5000);
      expect(result.status).toBe('failed');
    });

    test('returns immediately when status is inconclusive', async () => {
      mockGetRun.mockResolvedValue({
        run: {
          id: 'run-inc',
          apiVersionId: 'av-1',
          status: 'inconclusive',
          runnerId: null,
          claimedAt: null,
          createdAt: '',
          finishedAt: null,
        },
        steps: [],
      });

      const result = await useRunStore.getState().pollRun('run-inc', 5000);
      expect(result.status).toBe('inconclusive');
    });

    test('returns immediately when status is cancelled', async () => {
      mockGetRun.mockResolvedValue({
        run: {
          id: 'run-cxl',
          apiVersionId: 'av-1',
          status: 'cancelled',
          runnerId: null,
          claimedAt: null,
          createdAt: '',
          finishedAt: null,
        },
        steps: [],
      });

      const result = await useRunStore.getState().pollRun('run-cxl', 5000);
      expect(result.status).toBe('cancelled');
    });

    test('polls until terminal status is reached', async () => {
      let callCount = 0;
      mockGetRun.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            run: {
              id: 'run-poll',
              apiVersionId: 'av-1',
              status: 'running',
              runnerId: null,
              claimedAt: null,
              createdAt: '',
              finishedAt: null,
            },
            steps: [],
          });
        }
        return Promise.resolve({
          run: {
            id: 'run-poll',
            apiVersionId: 'av-1',
            status: 'passed',
            runnerId: null,
            claimedAt: null,
            createdAt: '',
            finishedAt: null,
          },
          steps: [],
        });
      });

      const result = await useRunStore.getState().pollRun('run-poll', 10000);

      expect(result.status).toBe('passed');
      expect(callCount).toBe(3);
    });

    test('throws on timeout', async () => {
      mockGetRun.mockResolvedValue({
        run: {
          id: 'run-slow',
          apiVersionId: 'av-1',
          status: 'running',
          runnerId: null,
          claimedAt: null,
          createdAt: '',
          finishedAt: null,
        },
        steps: [],
      });

      await expect(useRunStore.getState().pollRun('run-slow', 100)).rejects.toThrow(
        'did not complete',
      );
    });

    test('retries on network error', async () => {
      let callCount = 0;
      mockGetRun.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve({
          run: {
            id: 'run-retry',
            apiVersionId: 'av-1',
            status: 'passed',
            runnerId: null,
            claimedAt: null,
            createdAt: '',
            finishedAt: null,
          },
          steps: [],
        });
      });

      const result = await useRunStore.getState().pollRun('run-retry', 10000);

      expect(result.status).toBe('passed');
      expect(callCount).toBe(2);
    });

    test('updates run in local list when poll resolves', async () => {
      // Pre-populate the runs list
      useRunStore.setState({
        runs: [
          {
            id: 'run-upd',
            apiVersionId: 'av-1',
            status: 'running',
            runnerId: null,
            claimedAt: null,
            createdAt: '',
            finishedAt: null,
          },
        ],
      });

      mockGetRun.mockResolvedValue({
        run: {
          id: 'run-upd',
          apiVersionId: 'av-1',
          status: 'passed',
          runnerId: null,
          claimedAt: null,
          createdAt: '',
          finishedAt: null,
        },
        steps: [],
      });

      await useRunStore.getState().pollRun('run-upd', 5000);

      expect(useRunStore.getState().runs[0]!.status).toBe('passed');
    });
  });
});
