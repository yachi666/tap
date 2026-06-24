/**
 * environmentStore unit tests.
 *
 * Tests CRUD, setActiveEnvironmentId, and fetchFromServer.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

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
  LS_ENVIRONMENTS_KEY: 'sketchtest.environments:v1',
  LS_ACTIVE_ENV_KEY: 'sketchtest.active-env:v1',
}));

// ─── Mock cpClient ─────────────────────────────────────────────────

const { mockListEnvironments, mockListEnvVersions } = vi.hoisted(() => ({
  mockListEnvironments: vi.fn(),
  mockListEnvVersions: vi.fn(),
}));

vi.mock('../../lib/cp-client', () => ({
  cpClient: {
    listEnvironments: (...args: unknown[]) => mockListEnvironments(...args),
    listEnvironmentVersions: (...args: unknown[]) => mockListEnvVersions(...args),
  },
}));

// ─── Mock data ─────────────────────────────────────────────────────

vi.mock('../../data', () => ({
  initialEnvironments: [
    {
      id: 'env-dev',
      name: 'Development',
      description: 'Dev environment',
      tags: [],
      isProduction: false,
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'system',
    },
  ],
}));

// ─── Mock variableStore ────────────────────────────────────────────

const mockSetVariables = vi.fn();

vi.mock('../variableStore', () => ({
  useVariableStore: {
    getState: () => ({
      variables: [],
      setVariables: mockSetVariables,
    }),
  },
}));

import { useEnvironmentStore } from '../environmentStore';
import type { Environment } from '../../types';

// ─── Helpers ───────────────────────────────────────────────────────

function makeEnvironment(overrides: Partial<Environment> = {}): Environment {
  return {
    id: 'env-test',
    name: 'Test',
    description: 'Test environment',
    tags: [],
    isProduction: false,
    updatedAt: '2026-06-24T10:00:00Z',
    updatedBy: 'test',
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('environmentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLsGet.mockReturnValue(null);
    mockLsGetJSON.mockReturnValue([]);
    mockSetVariables.mockClear();

    useEnvironmentStore.setState({
      environments: [],
      activeEnvironmentId: '',
      versions: {},
      loading: false,
      error: null,
    } as any);
  });

  describe('setActiveEnvironmentId', () => {
    test('updates active environment', () => {
      useEnvironmentStore.getState().setActiveEnvironmentId('env-staging');
      expect(useEnvironmentStore.getState().activeEnvironmentId).toBe('env-staging');
    });
  });

  describe('createEnvironment', () => {
    test('prepends new environment to the list', () => {
      useEnvironmentStore.setState({
        environments: [makeEnvironment({ id: 'env-1', name: 'Existing' })],
      } as any);

      useEnvironmentStore
        .getState()
        .createEnvironment(makeEnvironment({ id: 'env-2', name: 'New Env' }));

      expect(useEnvironmentStore.getState().environments).toHaveLength(2);
      expect(useEnvironmentStore.getState().environments[0]!.name).toBe('New Env');
    });
  });

  describe('updateEnvironment', () => {
    test('updates an existing environment in-place', () => {
      useEnvironmentStore.setState({
        environments: [
          makeEnvironment({ id: 'env-1', name: 'Old Name' }),
          makeEnvironment({ id: 'env-2', name: 'Keep' }),
        ],
      } as any);

      useEnvironmentStore
        .getState()
        .updateEnvironment(makeEnvironment({ id: 'env-1', name: 'New Name' }));

      expect(useEnvironmentStore.getState().environments[0]!.name).toBe('New Name');
      expect(useEnvironmentStore.getState().environments[1]!.name).toBe('Keep');
    });
  });

  describe('deleteEnvironment', () => {
    test('removes environment and shifts active if needed', () => {
      useEnvironmentStore.setState({
        environments: [
          makeEnvironment({ id: 'env-1', name: 'First' }),
          makeEnvironment({ id: 'env-2', name: 'Second' }),
        ],
        activeEnvironmentId: 'env-1',
      } as any);

      useEnvironmentStore.getState().deleteEnvironment('env-1');

      const state = useEnvironmentStore.getState();
      expect(state.environments).toHaveLength(1);
      expect(state.environments[0]!.id).toBe('env-2');
      expect(state.activeEnvironmentId).toBe('env-2');
    });

    test('empty list after deleting last environment', () => {
      useEnvironmentStore.setState({
        environments: [makeEnvironment({ id: 'env-only' })],
        activeEnvironmentId: 'env-only',
      } as any);

      useEnvironmentStore.getState().deleteEnvironment('env-only');
      expect(useEnvironmentStore.getState().environments).toEqual([]);
    });
  });

  describe('fetchFromServer', () => {
    test('fetches environments and versions from CP', async () => {
      const cpEnvs = [
        {
          id: 'env-cp-1',
          name: 'CP Prod',
          description: 'From CP',
          createdAt: '2026-06-24T10:00:00Z',
        },
      ];
      const cpVersions = [
        {
          id: 'envv-1',
          environmentId: 'env-cp-1',
          version: 1,
          baseUrl: 'https://api.prod.com',
          variables: { host: 'api.prod.com' },
          createdAt: '2026-06-24T10:00:00Z',
        },
      ];

      mockListEnvironments.mockResolvedValue({ environments: cpEnvs });
      mockListEnvVersions.mockResolvedValue({ versions: cpVersions });

      await useEnvironmentStore.getState().fetchFromServer('ws-001');

      const state = useEnvironmentStore.getState();
      expect(state.environments).toHaveLength(1);
      expect(state.environments[0]!.name).toBe('CP Prod');
      expect(state.versions['env-cp-1']).toEqual(cpVersions);
      expect(state.loading).toBe(false);
    });

    test('sets error on fetch failure', async () => {
      mockListEnvironments.mockRejectedValue(new Error('Network error'));

      await useEnvironmentStore.getState().fetchFromServer('ws-001');

      const state = useEnvironmentStore.getState();
      expect(state.error).toContain('Network error');
      expect(state.loading).toBe(false);
    });
  });
});
