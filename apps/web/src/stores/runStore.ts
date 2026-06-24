import { create } from 'zustand';
import { initialRuns } from '../data';
import type { RunMeta } from '../types';

interface RunState {
  runs: RunMeta[];
  activeRunId: string | null;
  setActiveRunId: (id: string | null) => void;
}

export const useRunStore = create<RunState>((set) => ({
  runs: initialRuns,
  activeRunId: null,
  setActiveRunId: (activeRunId) => set({ activeRunId }),
}));
