export const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * Multipliers applied to the base per-token duration (60000 / wpm).
 * Kept as named constants so no timing magic numbers are scattered
 * through the RSVP engine implemented in a later phase.
 */
export const TIMING_MULTIPLIER = {
  normal: 1,
  shortPause: 1.4,
  sentencePause: 2.2,
  paragraphPause: 3,
} as const;

export type TimingCategory = keyof typeof TIMING_MULTIPLIER;

/**
 * Long-word timing bonus: words longer than this many characters get extra
 * display time, since longer words take longer to fixate on and read.
 */
export const LONG_TOKEN_CHAR_THRESHOLD = 8;

/** Extra duration multiplier applied per character beyond the threshold. */
export const LONG_TOKEN_EXTRA_MULTIPLIER_PER_CHAR = 0.06;

/** Caps the long-word bonus so a pathologically long token can't stall playback. */
export const LONG_TOKEN_MAX_BONUS_MULTIPLIER = 1;

/** Floor for a rescheduled tick (e.g. after a mid-token WPM change), to avoid a near-zero timeout. */
export const MIN_TICK_DURATION_MS = 16;
