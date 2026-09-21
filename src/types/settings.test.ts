import { describe, expect, it } from 'vitest';
import { DEFAULT_WPM } from '@/constants/reader';
import { THEME_PREFERENCES, type AppSettings } from '@/types/settings';

describe('AppSettings', () => {
  it('accepts a value built from the documented shape', () => {
    const settings: AppSettings = {
      theme: 'system',
      wpm: DEFAULT_WPM,
    };

    expect(THEME_PREFERENCES).toContain(settings.theme);
    expect(settings.wpm).toBe(DEFAULT_WPM);
  });
});
