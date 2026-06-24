/**
 * uiStore unit tests.
 *
 * Tests sidebar toggle and toast notification state.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({ sidebarOpen: false, toast: '' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sidebar', () => {
    test('initial state has sidebar closed', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    test('setSidebarOpen toggles sidebar', () => {
      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('toast notifications', () => {
    test('notify sets toast message', () => {
      useUIStore.getState().notify('Operation succeeded');
      expect(useUIStore.getState().toast).toBe('Operation succeeded');
    });

    test('toast clears after timeout', () => {
      useUIStore.getState().notify('Temporary message');
      expect(useUIStore.getState().toast).toBe('Temporary message');

      vi.advanceTimersByTime(2400);
      expect(useUIStore.getState().toast).toBe('');
    });

    test('notify before timeout does not clear early', () => {
      useUIStore.getState().notify('Message');
      vi.advanceTimersByTime(1000);
      expect(useUIStore.getState().toast).toBe('Message');
    });

    test('notify replaces toast message immediately', () => {
      useUIStore.getState().notify('First');
      vi.advanceTimersByTime(1000);
      expect(useUIStore.getState().toast).toBe('First');

      useUIStore.getState().notify('Second');
      // Toast content replaced immediately
      expect(useUIStore.getState().toast).toBe('Second');
    });

    test('old timer still fires after new notify (known behavior)', () => {
      useUIStore.getState().notify('First');
      vi.advanceTimersByTime(2000);
      useUIStore.getState().notify('Second');

      // First timer fires at t=2400, clearing toast even though 'Second' was shown
      vi.advanceTimersByTime(400);
      expect(useUIStore.getState().toast).toBe('');
    });
  });
});
