import { describe, expect, it } from 'vitest';
import { MILLISECONDS_PER_MINUTE, TIMING_MULTIPLIER } from '@/constants/timing';

describe('timing constants', () => {
  it('defines a minute in milliseconds', () => {
    expect(MILLISECONDS_PER_MINUTE).toBe(60_000);
  });

  it('never speeds up a token relative to the normal rate', () => {
    Object.values(TIMING_MULTIPLIER).forEach((multiplier) => {
      expect(multiplier).toBeGreaterThanOrEqual(TIMING_MULTIPLIER.normal);
    });
  });

  it('escalates pauses from short to sentence to paragraph', () => {
    expect(TIMING_MULTIPLIER.shortPause).toBeLessThan(TIMING_MULTIPLIER.sentencePause);
    expect(TIMING_MULTIPLIER.sentencePause).toBeLessThan(TIMING_MULTIPLIER.paragraphPause);
  });
});
