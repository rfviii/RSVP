import { useCallback, useSyncExternalStore } from 'react';
import { settingsStore } from '@/state/settings/settingsStore';
import type { AppSettings, ThemePreference } from '@/types/settings';

export interface UseSettingsResult {
  settings: AppSettings;
  setTheme: (theme: ThemePreference) => void;
  setWpm: (wpm: number) => void;
}

export function useSettings(): UseSettingsResult {
  const settings = useSyncExternalStore(
    (onStoreChange) => settingsStore.subscribe(onStoreChange),
    () => settingsStore.getSettings(),
  );

  const setTheme = useCallback((theme: ThemePreference) => settingsStore.setTheme(theme), []);
  const setWpm = useCallback((wpm: number) => settingsStore.setWpm(wpm), []);

  return { settings, setTheme, setWpm };
}
