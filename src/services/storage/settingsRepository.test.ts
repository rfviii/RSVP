import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_WPM, MIN_WPM } from '@/constants/reader';
import { SETTINGS_RECORD_ID } from '@/constants/storage';
import { db } from '@/services/storage/db';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/services/storage/settingsRepository';

beforeEach(async () => {
  await db.settings.clear();
});

afterEach(async () => {
  await db.settings.clear();
});

describe('loadSettings', () => {
  it('returns defaults when nothing has been saved', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns a previously saved value', async () => {
    await saveSettings({ theme: 'dark', wpm: 450 });

    expect(await loadSettings()).toEqual({ theme: 'dark', wpm: 450 });
  });

  it('falls back field-by-field for a partially invalid record', async () => {
    await db.settings.put({ id: SETTINGS_RECORD_ID, theme: 'not-a-real-theme' as never, wpm: 400 });

    expect(await loadSettings()).toEqual({ theme: DEFAULT_SETTINGS.theme, wpm: 400 });
  });

  it('clamps an out-of-range stored WPM instead of trusting it blindly', async () => {
    await db.settings.put({ id: SETTINGS_RECORD_ID, theme: 'light', wpm: 999_999 });
    expect((await loadSettings()).wpm).toBe(MAX_WPM);

    await db.settings.put({ id: SETTINGS_RECORD_ID, theme: 'light', wpm: -5 });
    expect((await loadSettings()).wpm).toBe(MIN_WPM);
  });
});

describe('saveSettings', () => {
  it('round-trips through loadSettings', async () => {
    await saveSettings({ theme: 'light', wpm: 350 });

    expect(await loadSettings()).toEqual({ theme: 'light', wpm: 350 });
  });
});
