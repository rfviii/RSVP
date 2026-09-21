import { describe, expect, it } from 'vitest';
import {
  LONG_TOKEN_CHAR_THRESHOLD,
  LONG_TOKEN_MAX_BONUS_MULTIPLIER,
  TIMING_MULTIPLIER,
} from '@/constants/timing';
import { calculateBaseDuration, calculateTokenDuration } from '@/domain/rsvp/timing';

const SHORT_WORD = 'a'.repeat(LONG_TOKEN_CHAR_THRESHOLD);

describe('calculateBaseDuration', () => {
  it('computes 60000 / wpm', () => {
    expect(calculateBaseDuration(300)).toBe(200);
    expect(calculateBaseDuration(600)).toBe(100);
  });
});

describe('calculateTokenDuration', () => {
  it('uses the normal multiplier for a token with no punctuation', () => {
    expect(calculateTokenDuration({ punctuation: 'none', text: SHORT_WORD }, 300)).toBe(
      200 * TIMING_MULTIPLIER.normal,
    );
  });

  it('applies the short-pause multiplier to comma, semicolon, colon, and dash', () => {
    const expected = Math.round(200 * TIMING_MULTIPLIER.shortPause);

    expect(calculateTokenDuration({ punctuation: 'comma', text: SHORT_WORD }, 300)).toBe(expected);
    expect(calculateTokenDuration({ punctuation: 'semicolon', text: SHORT_WORD }, 300)).toBe(expected);
    expect(calculateTokenDuration({ punctuation: 'colon', text: SHORT_WORD }, 300)).toBe(expected);
    expect(calculateTokenDuration({ punctuation: 'dash', text: SHORT_WORD }, 300)).toBe(expected);
  });

  it('applies the sentence-pause multiplier to a sentence ending', () => {
    expect(calculateTokenDuration({ punctuation: 'sentenceEnd', text: SHORT_WORD }, 300)).toBe(
      Math.round(200 * TIMING_MULTIPLIER.sentencePause),
    );
  });

  it('applies the paragraph-pause multiplier to a paragraph ending', () => {
    expect(calculateTokenDuration({ punctuation: 'paragraphEnd', text: SHORT_WORD }, 300)).toBe(
      Math.round(200 * TIMING_MULTIPLIER.paragraphPause),
    );
  });

  it('scales down as WPM increases', () => {
    const slow = calculateTokenDuration({ punctuation: 'none', text: SHORT_WORD }, 200);
    const fast = calculateTokenDuration({ punctuation: 'none', text: SHORT_WORD }, 600);

    expect(fast).toBeLessThan(slow);
  });

  it('gives a longer duration to a word past the long-token threshold', () => {
    const shortDuration = calculateTokenDuration({ punctuation: 'none', text: SHORT_WORD }, 300);
    const longDuration = calculateTokenDuration(
      { punctuation: 'none', text: 'a'.repeat(LONG_TOKEN_CHAR_THRESHOLD + 5) },
      300,
    );

    expect(longDuration).toBeGreaterThan(shortDuration);
  });

  it('does not give a duration bonus at or below the threshold', () => {
    const atThreshold = calculateTokenDuration({ punctuation: 'none', text: SHORT_WORD }, 300);
    const belowThreshold = calculateTokenDuration(
      { punctuation: 'none', text: 'a'.repeat(LONG_TOKEN_CHAR_THRESHOLD - 3) },
      300,
    );

    expect(atThreshold).toBe(belowThreshold);
  });

  it('caps the long-token bonus so an extreme length cannot stall playback', () => {
    const base = 200;
    const maxPossible = Math.round(base * TIMING_MULTIPLIER.normal * (1 + LONG_TOKEN_MAX_BONUS_MULTIPLIER));

    expect(calculateTokenDuration({ punctuation: 'none', text: 'a'.repeat(500) }, 300)).toBe(maxPossible);
  });
});
