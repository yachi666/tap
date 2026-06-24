/**
 * apiStore unit tests.
 *
 * Tests endpoint CRUD, source management, and CP API version fetching.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ─── Mock storage module ────────────────────────────────────────────
// Use vi.hoisted so the references are available when vi.mock hoists.

const { mockLoadApiSources, mockDeleteApiSource } = vi.hoisted(() => ({
  mockLoadApiSources: vi.fn((..._: any[]) => []),
  mockDeleteApiSource: vi.fn((..._: any[]) => {}),
}));

vi.mock('../../lib/storage', () => ({
  loadAllEndpoints: vi.fn(() => []),
  loadApiSources: (...args: any[]) => mockLoadApiSources(...args),
  deleteApiSource: (...args: any[]) => mockDeleteApiSource(...args),
}));

// ─── Mock cpClient ──────────────────────────────────────────────────

const { mockListApiVersions } = vi.hoisted(() => ({
  mockListApiVersions: vi.fn(),
}));

vi.mock('../../lib/cp-client', () => ({
  cpClient: {
    listApiVersions: (...args: unknown[]) => mockListApiVersions(...args),
  },
}));

// ─── Mock data module ───────────────────────────────────────────────

vi.mock('../../data', () => ({
  endpoints: [],
  endpointDetails: {},
  apiSchemas: {},
  apiSources: [],
}));

import { useApiStore } from '../apiStore';
import type { ApiEndpoint, ApiSource, EndpointDetail, SchemaDisplayNode } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────

function makeEndpoint(overrides: Partial<ApiEndpoint> = {}): any {
  return {
    id: 'ep-001',
    method: 'GET',
    path: '/api/users',
    summary: 'List users',
    deprecated: false,
    tags: ['users'],
    ...overrides,
  };
}

function makeDetail(overrides: Partial<EndpointDetail> = {}): any {
  return {
    endpointId: 'ep-001',
    description: 'Test endpoint',
    parameters: [],
    requestBodies: [],
    responses: [],
    authMethods: [],
    ...overrides,
  };
}

function makeSource(overrides: Partial<ApiSource> = {}): ApiSource {
  return {
    id: 'src-001',
    name: 'Test Source',
    description: '',
    sourceLabel: 'test-api',
    sourceType: 'openapi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('apiStore', () => {
  beforeEach(() => {
    mockLoadApiSources.mockReturnValue([]);
    mockDeleteApiSource.mockClear();
    mockListApiVersions.mockReset();
    useApiStore.setState({
      apiEndpoints: [],
      apiDetails: {},
      apiSchemas: {},
      apiSources: [],
      apiVersions: [],
      loading: false,
      error: null,
      imported: false,
      sourceDialogOpen: false,
      editingSource: null,
      manageSourcesOpen: false,
      sourceToDelete: null,
    });
  });

  // ── Endpoint CRUD ───────────────────────────────────────────

  describe('endpoint CRUD', () => {
    test('createEndpoint adds endpoint and detail', () => {
      const ep = makeEndpoint();
      const detail = makeDetail();
      useApiStore.getState().createEndpoint(ep, detail);

      const state = useApiStore.getState();
      expect(state.apiEndpoints).toHaveLength(1);
      expect(state.apiEndpoints[0]!.id).toBe('ep-001');
      expect(state.apiDetails['ep-001']).toEqual(detail);
    });

    test('updateEndpoint modifies an existing endpoint', () => {
      useApiStore.getState().createEndpoint(makeEndpoint(), makeDetail());
      useApiStore
        .getState()
        .updateEndpoint(
          makeEndpoint({ method: 'POST', summary: 'Create user' }),
          makeDetail({ description: 'Updated' }),
        );

      const state = useApiStore.getState();
      expect(state.apiEndpoints[0]!.method).toBe('POST');
      expect(state.apiEndpoints[0]!.summary).toBe('Create user');
      expect(state.apiDetails['ep-001']!.description).toBe('Updated');
    });

    test('deleteEndpoint removes endpoint and its detail', () => {
      useApiStore.getState().createEndpoint(makeEndpoint({ id: 'to-delete' }), makeDetail());
      expect(useApiStore.getState().apiEndpoints).toHaveLength(1);

      useApiStore.getState().deleteEndpoint('to-delete');

      const state = useApiStore.getState();
      expect(state.apiEndpoints).toHaveLength(0);
      expect(state.apiDetails['to-delete']).toBeUndefined();
    });

    test('deleteEndpoint for non-existent id does nothing', () => {
      useApiStore.getState().createEndpoint(makeEndpoint({ id: 'keep' }), makeDetail());
      useApiStore.getState().deleteEndpoint('non-existent');
      expect(useApiStore.getState().apiEndpoints).toHaveLength(1);
    });

    test('createSchema adds a schema node', () => {
      const schema: any = {
        id: 'schema-1',
        title: 'UserSchema',
        type: 'object',
        properties: [],
      };
      useApiStore.getState().createSchema(schema);
      expect(useApiStore.getState().apiSchemas['schema-1']).toEqual(schema);
    });

    test('multiple endpoints can coexist', () => {
      for (let i = 0; i < 5; i++) {
        useApiStore
          .getState()
          .createEndpoint(
            makeEndpoint({ id: `ep-${i}`, path: `/api/items/${i}` }),
            makeDetail({ endpointId: `ep-${i}` }),
          );
      }
      expect(useApiStore.getState().apiEndpoints).toHaveLength(5);
      expect(Object.keys(useApiStore.getState().apiDetails)).toHaveLength(5);
    });
  });

  // ── Source management ───────────────────────────────────────

  describe('source management', () => {
    test('setSourceDialogOpen toggles dialog visibility', () => {
      useApiStore.getState().setSourceDialogOpen(true);
      expect(useApiStore.getState().sourceDialogOpen).toBe(true);

      useApiStore.getState().setSourceDialogOpen(false);
      expect(useApiStore.getState().sourceDialogOpen).toBe(false);
    });

    test('openSourceDialog sets editing source and opens dialog', () => {
      const src = makeSource({ name: 'My API' });
      useApiStore.getState().openSourceDialog(src);

      expect(useApiStore.getState().editingSource).toEqual(src);
      expect(useApiStore.getState().sourceDialogOpen).toBe(true);
    });

    test('openSourceDialog with null opens dialog for creation', () => {
      useApiStore.getState().openSourceDialog(null);
      // If the dialog supports null for creation, it should be open
      expect(useApiStore.getState().editingSource).toBeNull();
      expect(useApiStore.getState().sourceDialogOpen).toBe(true);
    });

    test('saveSource creates a new source', () => {
      const src = makeSource({ id: 'new-src', name: 'New Source' });
      useApiStore.getState().saveSource(src);

      const state = useApiStore.getState();
      expect(state.apiSources).toHaveLength(1);
      expect(state.apiSources[0]!.name).toBe('New Source');
    });

    test('saveSource updates existing source', () => {
      useApiStore.getState().saveSource(makeSource({ id: 'src-x', name: 'Original' }));
      useApiStore.getState().saveSource(makeSource({ id: 'src-x', name: 'Updated' }));

      expect(useApiStore.getState().apiSources).toHaveLength(1);
      expect(useApiStore.getState().apiSources[0]!.name).toBe('Updated');
    });

    test('confirmDeleteSource removes source and calls storage', () => {
      useApiStore.getState().saveSource(makeSource({ id: 'to-delete', name: 'Delete Me' }));
      useApiStore.getState().setSourceToDelete(makeSource({ id: 'to-delete' }));

      useApiStore.getState().confirmDeleteSource();

      expect(mockDeleteApiSource).toHaveBeenCalledWith('to-delete');
      expect(useApiStore.getState().apiSources).toHaveLength(0);
      expect(useApiStore.getState().sourceToDelete).toBeNull();
    });

    test('confirmDeleteSource with null sourceToDelete is a no-op', () => {
      useApiStore.getState().saveSource(makeSource({ id: 'keep' }));
      useApiStore.getState().setSourceToDelete(null);

      useApiStore.getState().confirmDeleteSource();

      expect(mockDeleteApiSource).not.toHaveBeenCalled();
      expect(useApiStore.getState().apiSources).toHaveLength(1);
    });

    test('setManageSourcesOpen toggles manage panel', () => {
      useApiStore.getState().setManageSourcesOpen(true);
      expect(useApiStore.getState().manageSourcesOpen).toBe(true);

      useApiStore.getState().setManageSourcesOpen(false);
      expect(useApiStore.getState().manageSourcesOpen).toBe(false);
    });
  });

  // ── API Versions (CP) ───────────────────────────────────────

  describe('fetchApiVersions', () => {
    test('sets loading=true during fetch', async () => {
      mockListApiVersions.mockImplementation(() => new Promise((r) => setTimeout(r, 100)));
      const promise = useApiStore.getState().fetchApiVersions();
      expect(useApiStore.getState().loading).toBe(true);
      // Prevent unhandled rejection
      await promise.catch(() => {});
    });

    test('on success populates apiVersions and sets imported', async () => {
      const mockVersions = [
        {
          id: 'v1',
          source_type: 'openapi',
          source_location: '/api.yaml',
          content_hash: 'abc',
          created_at: '2026-01-01',
          endpoint_count: 10,
        },
      ];
      mockListApiVersions.mockResolvedValue({ apiVersions: mockVersions });

      await useApiStore.getState().fetchApiVersions();

      const state = useApiStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.apiVersions).toHaveLength(1);
      expect(state.apiVersions[0]!.sourceType).toBe('openapi');
      expect(state.apiVersions[0]!.endpointCount).toBe(10);
      expect(state.imported).toBe(true);
    });

    test('on success with empty list keeps imported=false', async () => {
      mockListApiVersions.mockResolvedValue({ apiVersions: [] });

      await useApiStore.getState().fetchApiVersions();

      expect(useApiStore.getState().imported).toBe(false);
    });

    test('on failure sets error and clears loading', async () => {
      mockListApiVersions.mockRejectedValue(new Error('Network error'));

      await useApiStore.getState().fetchApiVersions();

      const state = useApiStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toContain('Network error');
    });

    test('partial mapping handles missing optional fields', async () => {
      const mockVersions = [
        {
          id: 'v-min',
          source_type: 'file',
          source_location: '/spec.json',
          content_hash: 'def',
          created_at: '2026-01-02',
        },
      ];
      mockListApiVersions.mockResolvedValue({ apiVersions: mockVersions });

      await useApiStore.getState().fetchApiVersions();

      expect(useApiStore.getState().apiVersions[0]!.endpointCount).toBeUndefined();
    });
  });

  // ── Imported flag ───────────────────────────────────────────

  describe('imported flag', () => {
    test('setImported toggles the flag', () => {
      expect(useApiStore.getState().imported).toBe(false);
      useApiStore.getState().setImported(true);
      expect(useApiStore.getState().imported).toBe(true);
      useApiStore.getState().setImported(false);
      expect(useApiStore.getState().imported).toBe(false);
    });
  });
});
