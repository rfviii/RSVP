import type { Paragraph } from '@/domain/text/types';

/**
 * How many paragraphs of context to keep rendered before/after the current
 * one. Bounded deliberately: a book-scale document (hundreds of thousands
 * of tokens) can't have its full text in the DOM at once, so the hybrid
 * reader only ever renders a small window around the RSVP cursor.
 */
export const PARAGRAPHS_BEFORE_CURRENT = 2;
export const PARAGRAPHS_AFTER_CURRENT = 2;

/** Slices out the bounded window of paragraphs to render around `centerPosition`. */
export function selectVisibleParagraphs(
  paragraphs: Paragraph[],
  centerPosition: number,
  before: number = PARAGRAPHS_BEFORE_CURRENT,
  after: number = PARAGRAPHS_AFTER_CURRENT,
): Paragraph[] {
  const start = Math.max(0, centerPosition - before);
  const end = Math.min(paragraphs.length, centerPosition + after + 1);
  return paragraphs.slice(start, end);
}
