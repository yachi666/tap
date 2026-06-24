import { create } from 'zustand';
import {
  lsGet,
  lsGetJSON,
  lsSet,
  lsSetJSON,
  LS_ACTIVE_ENV_KEY,
  LS_ENVIRONMENTS_KEY,
} from '../lib/storage';
import { initialEnvironments } from '../data';
import type { Environment } from '../types';
import { useVariableStore } from './variableStore';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string;
  setActiveEnvironmentId: (id: string) => void;
  createEnvironment: (env: Environment) => void;
  updateEnvironment: (env: Environment) => void;
  deleteEnvironment: (envId: string) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: lsGetJSON<Environment[]>(LS_ENVIRONMENTS_KEY, initialEnvironments, (parsed) =>
    Array.isArray(parsed) &&
    parsed.every((e) => e && typeof e === 'object' && 'id' in e && 'name' in e)
      ? (parsed as Environment[])
      : null,
  ),

  activeEnvironmentId: (() => {
    try {
      const stored = lsGet(LS_ACTIVE_ENV_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return initialEnvironments[0].id;
  })(),

  setActiveEnvironmentId: (id) => {
    lsSet(LS_ACTIVE_ENV_KEY, id);
    set({ activeEnvironmentId: id });
  },

  createEnvironment: (env) =>
    set((state) => {
      const next = [env, ...state.environments];
      lsSetJSON(LS_ENVIRONMENTS_KEY, next);
      return { environments: next };
    }),

  updateEnvironment: (env) =>
    set((state) => {
      const next = state.environments.map((x) => (x.id === env.id ? env : x));
      lsSetJSON(LS_ENVIRONMENTS_KEY, next);
      return { environments: next };
    }),

  deleteEnvironment: (envId) =>
    set((state) => {
      const target = state.environments.find((x) => x.id === envId);
      const next = state.environments.filter((x) => x.id !== envId);
      lsSetJSON(LS_ENVIRONMENTS_KEY, next);

      // Switch active env if deleted
      const newActiveId =
        state.activeEnvironmentId === envId && next.length > 0
          ? next[0].id
          : state.activeEnvironmentId;
      if (newActiveId !== state.activeEnvironmentId) {
        lsSet(LS_ACTIVE_ENV_KEY, newActiveId);
      }

      // Clean up variable overrides pointing to this env
      const variableStore = useVariableStore.getState();
      const vars = variableStore.variables;
      const cleaned = vars.map((v) => {
        const newOverrides = { ...v.overrides };
        delete newOverrides[envId];
        return { ...v, overrides: newOverrides };
      });
      variableStore.setVariables(cleaned);
      lsSetJSON('sketchtest.variables:v1', cleaned);

      return { environments: next, activeEnvironmentId: newActiveId };
    }),
}));
