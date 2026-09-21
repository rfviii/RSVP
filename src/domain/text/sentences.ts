const SENTENCE_END_CHARS = new Set(['.', '!', '?']);
const CLOSING_CHARS = new Set(['"', "'", '’', '”', ')', ']', '}']);

/**
 * Common abbreviations that end in a period but do not end a sentence.
 * Practical coverage, not an exhaustive linguistic list (spec §11: "useful
 * timing and navigation, not linguistic research").
 */
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'u.s',
  'u.k',
  'a.m',
  'p.m',
  'no',
  'inc',
  'ltd',
  'co',
]);

function isAbbreviation(precedingText: string): boolean {
  const lastWord = precedingText.trim().split(/\s+/).pop();

  if (!lastWord) {
    return false;
  }

  return ABBREVIATIONS.has(lastWord.toLowerCase().replace(/\.$/, ''));
}

/**
 * Splits a block of text into sentences using practical rules: terminal
 * punctuation (. ! ?), optionally followed by closing quotes/brackets, ends
 * a sentence unless the preceding word is a known abbreviation.
 */
export function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char !== undefined && SENTENCE_END_CHARS.has(char)) {
      let end = index + 1;

      while (end < text.length) {
        const next = text[end];
        if (next === undefined || !CLOSING_CHARS.has(next)) {
          break;
        }
        end += 1;
      }

      const nextChar = text[end];
      const isBoundary = end >= text.length || (nextChar !== undefined && /\s/.test(nextChar));

      if (isBoundary) {
        const candidate = text.slice(start, end).trim();

        if (candidate.length > 0 && !(char === '.' && isAbbreviation(text.slice(start, index)))) {
          sentences.push(candidate);
          start = end;
          index = end;
          continue;
        }
      }
    }

    index += 1;
  }

  const remaining = text.slice(start).trim();
  if (remaining.length > 0) {
    sentences.push(remaining);
  }

  return sentences;
}
