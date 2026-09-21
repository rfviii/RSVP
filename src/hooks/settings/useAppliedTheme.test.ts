import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAppliedTheme } from '@/hooks/settings/useAppliedTheme';
import { settingsStore } from '@/state/settings/settingsStore';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('useAppliedTheme', () => {
  it('adds the dark class when the theme is dark', () => {
    settingsStore.setTheme('dark');
    renderHook(() => useAppliedTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class when the theme is light', () => {
    document.documentElement.classList.add('dark');
    settingsStore.setTheme('light');
    renderHook(() => useAppliedTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to the OS preference (stubbed as light) when the theme is system', () => {
    settingsStore.setTheme('system');
    renderHook(() => useAppliedTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('re-applies when the theme changes after mount', () => {
    settingsStore.setTheme('light');
    renderHook(() => useAppliedTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      settingsStore.setTheme('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
