import { describe, expect, it } from 'vitest';
import { DEFAULT_WPM, MAX_WPM, MIN_WPM, WPM_STEP } from '@/constants/reader';

describe('reader constants', () => {
  it('keeps the default WPM within the allowed range', () => {
    expect(DEFAULT_WPM).toBeGreaterThanOrEqual(MIN_WPM);
    expect(DEFAULT_WPM).toBeLessThanOrEqual(MAX_WPM);
  });

  it('defines a sensible, non-zero adjustment step', () => {
    expect(WPM_STEP).toBeGreaterThan(0);
    expect(WPM_STEP).toBeLessThan(MAX_WPM - MIN_WPM);
  });

  it('defines a positive WPM range', () => {
    expect(MIN_WPM).toBeGreaterThan(0);
    expect(MAX_WPM).toBeGreaterThan(MIN_WPM);
  });
});
