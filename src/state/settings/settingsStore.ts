import { MAX_WPM, MIN_WPM } from '@/constants/reader';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/services/storage/settingsRepository';
import type { AppSettings, ReadingBehavior, ThemePreference } from '@/types/settings';

type SettingsListener = (settings: AppSettings) => void;

function clampWpm(wpm: number): number {
  return Math.min(Math.max(wpm, MIN_WPM), MAX_WPM);
}

/**
 * App-wide settings state: starts from defaults synchronously (so
 * `useSyncExternalStore` always has an immediate snapshot to render), then
 * loads the persisted value from IndexedDB and notifies once it arrives.
 * Every change is re-persisted. No React here, same subscribe/notify shape
 * as RsvpEngine.
 */
export class SettingsStore {
  private settings: AppSettings = DEFAULT_SETTINGS;
  private readonly listeners = new Set<SettingsListener>();
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = loadSettings()
      .then((loaded) => {
        this.settings = loaded;
        this.notify();
      })
      .catch(() => {
        // loadSettings already falls back to defaults internally; nothing further to do.
      });
  }

  /** Resolves once the persisted value (or the default, on failure) has been loaded and applied. */
  whenReady(): Promise<void> {
    return this.ready;
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  setTheme(theme: ThemePreference): void {
    this.update({ ...this.settings, theme });
  }

  setWpm(wpm: number): void {
    this.update({ ...this.settings, wpm: clampWpm(wpm) });
  }

  setReadingBehavior(readingBehavior: ReadingBehavior): void {
    this.update({ ...this.settings, readingBehavior });
  }

  setPauseOnScroll(pauseOnScroll: boolean): void {
    this.update({ ...this.settings, pauseOnScroll });
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private update(next: AppSettings): void {
    this.settings = next;
    this.notify();
    // Persistence is best-effort here: a failed save shouldn't crash the
    // app or surface as an unhandled rejection, just leave this change
    // un-persisted for next time.
    saveSettings(next).catch(() => {});
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.settings));
  }
}

export const settingsStore = new SettingsStore();
