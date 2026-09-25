import { describe, expect, it } from 'vitest';
import { selectVisibleParagraphs } from '@/domain/reader/readerWindow';
import type { Paragraph } from '@/domain/text/types';

function makeParagraphs(count: number): Paragraph[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `paragraph-${i}`,
    pageNumber: 1,
    sentences: [],
  }));
}

describe('selectVisibleParagraphs', () => {
  it('includes the given number of paragraphs before and after the center', () => {
    const paragraphs = makeParagraphs(10);

    const window = selectVisibleParagraphs(paragraphs, 5, 2, 2);

    expect(window.map((p) => p.id)).toEqual([
      'paragraph-3',
      'paragraph-4',
      'paragraph-5',
      'paragraph-6',
      'paragraph-7',
    ]);
  });

  it('clamps the window at the start of the document', () => {
    const paragraphs = makeParagraphs(10);

    const window = selectVisibleParagraphs(paragraphs, 0, 2, 2);

    expect(window.map((p) => p.id)).toEqual(['paragraph-0', 'paragraph-1', 'paragraph-2']);
  });

  it('clamps the window at the end of the document', () => {
    const paragraphs = makeParagraphs(10);

    const window = selectVisibleParagraphs(paragraphs, 9, 2, 2);

    expect(window.map((p) => p.id)).toEqual(['paragraph-7', 'paragraph-8', 'paragraph-9']);
  });

  it('never exceeds the bounds of a document smaller than the window', () => {
    const paragraphs = makeParagraphs(2);

    const window = selectVisibleParagraphs(paragraphs, 0, 2, 2);

    expect(window).toHaveLength(2);
  });
});
