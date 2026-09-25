import { describe, expect, it } from 'vitest';
import { DEFAULT_WPM } from '@/constants/reader';
import { READING_BEHAVIORS, THEME_PREFERENCES, type AppSettings } from '@/types/settings';

describe('AppSettings', () => {
  it('accepts a value built from the documented shape', () => {
    const settings: AppSettings = {
      theme: 'system',
      wpm: DEFAULT_WPM,
      readingBehavior: 'normal',
      pauseOnScroll: true,
    };

    expect(THEME_PREFERENCES).toContain(settings.theme);
    expect(settings.wpm).toBe(DEFAULT_WPM);
    expect(READING_BEHAVIORS).toContain(settings.readingBehavior);
    expect(settings.pauseOnScroll).toBe(true);
  });
});
