import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_WPM, MIN_WPM } from '@/constants/reader';
import { db } from '@/services/storage/db';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/services/storage/settingsRepository';
import { SettingsStore } from '@/state/settings/settingsStore';

beforeEach(async () => {
  await db.settings.clear();
});

afterEach(async () => {
  await db.settings.clear();
});

describe('SettingsStore', () => {
  it('starts from defaults synchronously, before the persisted value can load', () => {
    const store = new SettingsStore();

    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('adopts the persisted value once loading completes', async () => {
    await saveSettings({ theme: 'dark', wpm: 400 });

    const store = new SettingsStore();
    await store.whenReady();

    expect(store.getSettings()).toEqual({ theme: 'dark', wpm: 400 });
  });

  it('updates the theme and persists it', async () => {
    const store = new SettingsStore();
    await store.whenReady();

    store.setTheme('light');

    expect(store.getSettings().theme).toBe('light');
    await vi.waitFor(async () => {
      expect((await loadSettings()).theme).toBe('light');
    });
  });

  it('updates and clamps the WPM, and persists it', async () => {
    const store = new SettingsStore();
    await store.whenReady();

    store.setWpm(500);
    expect(store.getSettings().wpm).toBe(500);

    store.setWpm(999_999);
    expect(store.getSettings().wpm).toBe(MAX_WPM);

    store.setWpm(-10);
    expect(store.getSettings().wpm).toBe(MIN_WPM);

    await vi.waitFor(async () => {
      expect((await loadSettings()).wpm).toBe(MIN_WPM);
    });
  });

  it('notifies subscribers on every change and stops after unsubscribing', async () => {
    const store = new SettingsStore();
    await store.whenReady();

    const seen: string[] = [];
    const unsubscribe = store.subscribe((settings) => seen.push(settings.theme));

    store.setTheme('dark');
    unsubscribe();
    store.setTheme('light');

    expect(seen).toEqual(['dark']);
  });
});
