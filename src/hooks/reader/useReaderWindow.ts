import { useMemo } from 'react';
import { buildParagraphPositionIndex } from '@/domain/reader/paragraphIndex';
import { selectVisibleParagraphs } from '@/domain/reader/readerWindow';
import type { Paragraph, TextDocument } from '@/domain/text/types';

/**
 * The bounded slice of paragraphs to render around the current RSVP
 * position. Recomputes only when the current *paragraph* changes, not on
 * every token tick within the same paragraph — ticks can happen several
 * times a second, and re-slicing on every one would be wasted work since
 * the visible window itself usually hasn't moved.
 */
export function useReaderWindow(document: TextDocument, currentParagraphIndex: number | undefined): Paragraph[] {
  const positionByParagraphIndex = useMemo(() => buildParagraphPositionIndex(document), [document]);

  const centerPosition =
    currentParagraphIndex !== undefined ? positionByParagraphIndex.get(currentParagraphIndex) ?? 0 : 0;

  return useMemo(
    () => selectVisibleParagraphs(document.paragraphs, centerPosition),
    [document, centerPosition],
  );
}
