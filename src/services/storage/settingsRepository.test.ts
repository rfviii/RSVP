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
    await saveSettings({ theme: 'dark', wpm: 450, readingBehavior: 'focus', pauseOnScroll: false });

    expect(await loadSettings()).toEqual({
      theme: 'dark',
      wpm: 450,
      readingBehavior: 'focus',
      pauseOnScroll: false,
    });
  });

  it('falls back field-by-field for a partially invalid record', async () => {
    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'not-a-real-theme' as never,
      wpm: 400,
      readingBehavior: 'focus',
      pauseOnScroll: true,
    });

    expect(await loadSettings()).toEqual({
      theme: DEFAULT_SETTINGS.theme,
      wpm: 400,
      readingBehavior: 'focus',
      pauseOnScroll: true,
    });
  });

  it('clamps an out-of-range stored WPM instead of trusting it blindly', async () => {
    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'light',
      wpm: 999_999,
      readingBehavior: 'normal',
      pauseOnScroll: true,
    });
    expect((await loadSettings()).wpm).toBe(MAX_WPM);

    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'light',
      wpm: -5,
      readingBehavior: 'normal',
      pauseOnScroll: true,
    });
    expect((await loadSettings()).wpm).toBe(MIN_WPM);
  });

  it('falls back to the default reading behavior for an invalid stored value', async () => {
    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'light',
      wpm: 300,
      readingBehavior: 'not-a-mode' as never,
      pauseOnScroll: true,
    });

    expect((await loadSettings()).readingBehavior).toBe(DEFAULT_SETTINGS.readingBehavior);
  });

  it('falls back to the default reading behavior for a legacy record that predates this setting', async () => {
    // Simulates a settings row saved before this feature existed.
    await db.settings.put({ id: SETTINGS_RECORD_ID, theme: 'light', wpm: 300 } as never);

    expect((await loadSettings()).readingBehavior).toBe(DEFAULT_SETTINGS.readingBehavior);
  });

  it('falls back to the default pauseOnScroll for an invalid stored value', async () => {
    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'light',
      wpm: 300,
      readingBehavior: 'normal',
      pauseOnScroll: 'yes' as never,
    });

    expect((await loadSettings()).pauseOnScroll).toBe(DEFAULT_SETTINGS.pauseOnScroll);
  });

  it('falls back to the default pauseOnScroll for a legacy record that predates this setting', async () => {
    await db.settings.put({
      id: SETTINGS_RECORD_ID,
      theme: 'light',
      wpm: 300,
      readingBehavior: 'normal',
    } as never);

    expect((await loadSettings()).pauseOnScroll).toBe(DEFAULT_SETTINGS.pauseOnScroll);
  });
});

describe('saveSettings', () => {
  it('round-trips through loadSettings', async () => {
    await saveSettings({ theme: 'light', wpm: 350, readingBehavior: 'focus', pauseOnScroll: false });

    expect(await loadSettings()).toEqual({
      theme: 'light',
      wpm: 350,
      readingBehavior: 'focus',
      pauseOnScroll: false,
    });
  });
});
