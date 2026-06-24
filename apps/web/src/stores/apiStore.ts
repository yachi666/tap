import { create } from 'zustand';
import { loadApiSources, deleteApiSource } from '../lib/storage';
import { endpoints, endpointDetails, apiSchemas, apiSources as initialApiSources } from '../data';
import type { ApiEndpoint, ApiSource, EndpointDetail, SchemaDisplayNode } from '../types';

interface ApiState {
  imported: boolean;
  apiEndpoints: ApiEndpoint[];
  apiDetails: Record<string, EndpointDetail>;
  apiSchemas: Record<string, SchemaDisplayNode>;
  apiSources: ApiSource[];
  sourceDialogOpen: boolean;
  editingSource: ApiSource | null;
  manageSourcesOpen: boolean;
  sourceToDelete: ApiSource | null;

  setImported: (v: boolean) => void;
  createEndpoint: (endpoint: ApiEndpoint, detail: EndpointDetail) => void;
  updateEndpoint: (endpoint: ApiEndpoint, detail: EndpointDetail) => void;
  deleteEndpoint: (endpointId: string) => void;
  createSchema: (schema: SchemaDisplayNode) => void;

  setSourceDialogOpen: (open: boolean) => void;
  setEditingSource: (source: ApiSource | null) => void;
  setManageSourcesOpen: (open: boolean) => void;
  setSourceToDelete: (source: ApiSource | null) => void;
  openSourceDialog: (source: ApiSource | null) => void;
  saveSource: (saved: ApiSource) => void;
  confirmDeleteSource: () => void;
}

export const useApiStore = create<ApiState>((set, get) => ({
  imported: false,
  apiEndpoints: endpoints,
  apiDetails: endpointDetails,
  apiSchemas,
  apiSources: (() => {
    const stored = loadApiSources();
    if (stored.length > 0) return stored as ApiSource[];
    return initialApiSources as ApiSource[];
  })(),
  sourceDialogOpen: false,
  editingSource: null,
  manageSourcesOpen: false,
  sourceToDelete: null,

  setImported: (imported) => set({ imported }),

  createEndpoint: (endpoint, detail) =>
    set((state) => ({
      apiEndpoints: [...state.apiEndpoints, endpoint],
      apiDetails: { ...state.apiDetails, [endpoint.id]: detail },
    })),

  updateEndpoint: (endpoint, detail) =>
    set((state) => ({
      apiEndpoints: state.apiEndpoints.map((ep) =>
        ep.id === endpoint.id ? { ...ep, ...endpoint } : ep,
      ),
      apiDetails: { ...state.apiDetails, [endpoint.id]: detail },
    })),

  deleteEndpoint: (endpointId) =>
    set((state) => {
      const next = { ...state.apiDetails };
      delete next[endpointId];
      return {
        apiEndpoints: state.apiEndpoints.filter((ep) => ep.id !== endpointId),
        apiDetails: next,
      };
    }),

  createSchema: (schema) =>
    set((state) => ({
      apiSchemas: { ...state.apiSchemas, [schema.id]: schema },
    })),

  setSourceDialogOpen: (sourceDialogOpen) => set({ sourceDialogOpen }),
  setEditingSource: (editingSource) => set({ editingSource }),
  setManageSourcesOpen: (manageSourcesOpen) => set({ manageSourcesOpen }),
  setSourceToDelete: (sourceToDelete) => set({ sourceToDelete }),

  openSourceDialog: (source) => set({ editingSource: source, sourceDialogOpen: true }),

  saveSource: (saved) =>
    set((state) => {
      const idx = state.apiSources.findIndex((s) => s.id === saved.id);
      const apiSources =
        idx >= 0
          ? state.apiSources.map((s) => (s.id === saved.id ? saved : s))
          : [...state.apiSources, saved];
      return { apiSources };
    }),

  confirmDeleteSource: () => {
    const { sourceToDelete } = get();
    if (!sourceToDelete) return;
    deleteApiSource(sourceToDelete.id);
    set((state) => ({
      apiSources: state.apiSources.filter((s) => s.id !== sourceToDelete.id),
      sourceToDelete: null,
    }));
  },
}));
