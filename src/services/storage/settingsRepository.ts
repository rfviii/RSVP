import { DEFAULT_WPM, MAX_WPM, MIN_WPM } from '@/constants/reader';
import { SETTINGS_RECORD_ID } from '@/constants/storage';
import { db, type SettingsRow } from '@/services/storage/db';
import { StorageError } from '@/services/storage/errors';
import {
  READING_BEHAVIORS,
  THEME_PREFERENCES,
  type AppSettings,
  type ReadingBehavior,
  type ThemePreference,
} from '@/types/settings';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  wpm: DEFAULT_WPM,
  readingBehavior: 'normal',
  // Matches the prior (hardcoded) behavior, so existing users see no change unless they opt out.
  pauseOnScroll: true,
};

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

function isReadingBehavior(value: unknown): value is ReadingBehavior {
  return typeof value === 'string' && (READING_BEHAVIORS as readonly string[]).includes(value);
}

/** Falls back field-by-field to defaults rather than discarding the whole record on one bad field. */
function sanitizeSettings(value: unknown): AppSettings {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_SETTINGS;
  }

  const candidate = value as Partial<AppSettings>;

  const theme = isThemePreference(candidate.theme) ? candidate.theme : DEFAULT_SETTINGS.theme;
  const wpm =
    typeof candidate.wpm === 'number' && Number.isFinite(candidate.wpm)
      ? Math.min(Math.max(candidate.wpm, MIN_WPM), MAX_WPM)
      : DEFAULT_SETTINGS.wpm;
  const readingBehavior = isReadingBehavior(candidate.readingBehavior)
    ? candidate.readingBehavior
    : DEFAULT_SETTINGS.readingBehavior;
  const pauseOnScroll =
    typeof candidate.pauseOnScroll === 'boolean' ? candidate.pauseOnScroll : DEFAULT_SETTINGS.pauseOnScroll;

  return { theme, wpm, readingBehavior, pauseOnScroll };
}

/** Reads persisted settings, falling back to defaults for a missing record, a corrupted one, or a storage failure. */
export async function loadSettings(): Promise<AppSettings> {
  let row: SettingsRow | undefined;
  try {
    row = await db.settings.get(SETTINGS_RECORD_ID);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return sanitizeSettings(row);
}

/** Persists settings; a storage failure here is surfaced so callers can decide whether to warn the user. */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await db.settings.put({ id: SETTINGS_RECORD_ID, ...settings });
  } catch (error) {
    throw new StorageError('write-failed', 'Settings could not be saved.', { cause: error });
  }
}
