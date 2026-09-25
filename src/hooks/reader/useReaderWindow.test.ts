import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReaderWindow } from '@/hooks/reader/useReaderWindow';
import type { TextDocument } from '@/domain/text/types';

function makeDocument(paragraphCount: number): TextDocument {
  return {
    paragraphs: Array.from({ length: paragraphCount }, (_, paragraphIndex) => ({
      id: `paragraph-${paragraphIndex}`,
      pageNumber: 1,
      sentences: [
        {
          id: `sentence-${paragraphIndex}-0`,
          tokens: [
            {
              id: `token-${paragraphIndex}`,
              text: `word${paragraphIndex}`,
              index: paragraphIndex,
              sentenceIndex: 0,
              paragraphIndex,
              pageNumber: 1,
              trailingText: '',
              punctuation: 'none',
            },
          ],
        },
      ],
    })),
  };
}

describe('useReaderWindow', () => {
  it('returns a window centered on the paragraph containing the current token', () => {
    const document = makeDocument(10);

    const { result } = renderHook(() => useReaderWindow(document, 5));

    expect(result.current.map((p) => p.id)).toEqual([
      'paragraph-3',
      'paragraph-4',
      'paragraph-5',
      'paragraph-6',
      'paragraph-7',
    ]);
  });

  it('defaults to the start of the document when there is no current paragraph yet', () => {
    const document = makeDocument(10);

    const { result } = renderHook(() => useReaderWindow(document, undefined));

    expect(result.current[0]?.id).toBe('paragraph-0');
  });

  it('does not recompute the window when the paragraph index is unchanged', () => {
    const document = makeDocument(10);

    const { result, rerender } = renderHook(({ paragraphIndex }) => useReaderWindow(document, paragraphIndex), {
      initialProps: { paragraphIndex: 5 },
    });
    const firstResult = result.current;

    rerender({ paragraphIndex: 5 });

    expect(result.current).toBe(firstResult);
  });
});
