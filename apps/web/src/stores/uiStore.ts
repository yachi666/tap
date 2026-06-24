import { create } from 'zustand';

export interface UIState {
  sidebarOpen: boolean;
  toast: string;
  setSidebarOpen: (open: boolean) => void;
  notify: (message: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toast: '',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  notify: (message: string) => {
    set({ toast: message });
    window.setTimeout(() => set({ toast: '' }), 2400);
  },
}));
