import type { PunctuationType } from '@/domain/text/types';

const TOKEN_PATTERN = /\p{L}+(?:['’-]\p{L}+)*|\p{N}+(?:[.,]\p{N}+)*/gu;
const IGNORED_TRAILING_CHARS = /["'’”)\]}]/g;

function classifyTrailingPunctuation(trailing: string): PunctuationType {
  const significant = trailing.replace(IGNORED_TRAILING_CHARS, '').trim();

  if (significant.length === 0) {
    return 'none';
  }

  const first = significant[0];

  if (first === '.' || first === '!' || first === '?') {
    return 'sentenceEnd';
  }
  if (first === ',') {
    return 'comma';
  }
  if (first === ';') {
    return 'semicolon';
  }
  if (first === ':') {
    return 'colon';
  }
  if (first === '-' || first === '–' || first === '—') {
    return 'dash';
  }

  return 'none';
}

export interface WordToken {
  text: string;
  punctuation: PunctuationType;
}

/**
 * Splits a sentence into word/number tokens, classifying the punctuation
 * immediately following each one. Contractions ("don't") and hyphenated
 * compounds ("well-known") stay as single tokens; numbers keep internal
 * separators ("3.14", "1,000").
 */
export function tokenizeSentence(sentenceText: string): WordToken[] {
  const matches = [...sentenceText.matchAll(TOKEN_PATTERN)];

  return matches.map((match, position) => {
    const text = match[0];
    const matchEnd = match.index + text.length;
    const nextMatch = matches[position + 1];
    const trailingEnd = nextMatch?.index ?? sentenceText.length;
    const trailing = sentenceText.slice(matchEnd, trailingEnd);

    return { text, punctuation: classifyTrailingPunctuation(trailing) };
  });
}
