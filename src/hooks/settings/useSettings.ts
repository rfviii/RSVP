import { useCallback, useSyncExternalStore } from 'react';
import { settingsStore } from '@/state/settings/settingsStore';
import type { AppSettings, ReadingBehavior, ThemePreference } from '@/types/settings';

export interface UseSettingsResult {
  settings: AppSettings;
  setTheme: (theme: ThemePreference) => void;
  setWpm: (wpm: number) => void;
  setReadingBehavior: (readingBehavior: ReadingBehavior) => void;
  setPauseOnScroll: (pauseOnScroll: boolean) => void;
}

export function useSettings(): UseSettingsResult {
  const settings = useSyncExternalStore(
    (onStoreChange) => settingsStore.subscribe(onStoreChange),
    () => settingsStore.getSettings(),
  );

  const setTheme = useCallback((theme: ThemePreference) => settingsStore.setTheme(theme), []);
  const setWpm = useCallback((wpm: number) => settingsStore.setWpm(wpm), []);
  const setReadingBehavior = useCallback(
    (readingBehavior: ReadingBehavior) => settingsStore.setReadingBehavior(readingBehavior),
    [],
  );
  const setPauseOnScroll = useCallback(
    (pauseOnScroll: boolean) => settingsStore.setPauseOnScroll(pauseOnScroll),
    [],
  );

  return { settings, setTheme, setWpm, setReadingBehavior, setPauseOnScroll };
}
