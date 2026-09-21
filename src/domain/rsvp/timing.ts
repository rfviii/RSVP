import {
  LONG_TOKEN_CHAR_THRESHOLD,
  LONG_TOKEN_EXTRA_MULTIPLIER_PER_CHAR,
  LONG_TOKEN_MAX_BONUS_MULTIPLIER,
  MILLISECONDS_PER_MINUTE,
  TIMING_MULTIPLIER,
  type TimingCategory,
} from '@/constants/timing';
import type { PunctuationType, Token } from '@/domain/text/types';

/** baseDuration = 60000 / wpm, per the spec's WPM formula. */
export function calculateBaseDuration(wpm: number): number {
  return MILLISECONDS_PER_MINUTE / wpm;
}

function timingCategoryForPunctuation(punctuation: PunctuationType): TimingCategory {
  switch (punctuation) {
    case 'paragraphEnd':
      return 'paragraphPause';
    case 'sentenceEnd':
      return 'sentencePause';
    case 'comma':
    case 'semicolon':
    case 'colon':
    case 'dash':
      return 'shortPause';
    case 'none':
      return 'normal';
  }
}

/** Extra multiplier for words longer than the threshold; they take longer to read at a glance. */
function longTokenBonusMultiplier(text: string): number {
  const extraChars = Math.max(0, text.length - LONG_TOKEN_CHAR_THRESHOLD);
  return Math.min(extraChars * LONG_TOKEN_EXTRA_MULTIPLIER_PER_CHAR, LONG_TOKEN_MAX_BONUS_MULTIPLIER);
}

/** How long a single token should be displayed at the given WPM. */
export function calculateTokenDuration(token: Pick<Token, 'punctuation' | 'text'>, wpm: number): number {
  const category = timingCategoryForPunctuation(token.punctuation);
  const bonus = 1 + longTokenBonusMultiplier(token.text);
  return Math.round(calculateBaseDuration(wpm) * TIMING_MULTIPLIER[category] * bonus);
}
