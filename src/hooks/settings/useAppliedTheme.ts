import { useEffect } from 'react';
import { useSettings } from '@/hooks/settings/useSettings';
import type { ThemePreference } from '@/types/settings';

function resolveIsDark(theme: ThemePreference): boolean {
  if (theme === 'dark') {
    return true;
  }
  if (theme === 'light') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Applies the theme preference to the document root as a `dark` class, tracking OS changes when set to "system". */
export function useAppliedTheme(): void {
  const {
    settings: { theme },
  } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      root.classList.toggle('dark', resolveIsDark(theme));
    }

    applyTheme();

    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);
}
