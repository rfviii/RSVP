import type { TextDocument } from '@/domain/text/types';

/**
 * Maps each paragraph's `paragraphIndex` (from its tokens) to its position
 * within `document.paragraphs`. The two aren't always the same number:
 * `paragraphIndex` counts every paragraph the tokenizer ever produced,
 * including ones later dropped for ending up empty, so gaps are possible.
 */
export function buildParagraphPositionIndex(document: TextDocument): Map<number, number> {
  const positionByParagraphIndex = new Map<number, number>();

  document.paragraphs.forEach((paragraph, position) => {
    const paragraphIndex = paragraph.sentences[0]?.tokens[0]?.paragraphIndex;
    if (paragraphIndex !== undefined) {
      positionByParagraphIndex.set(paragraphIndex, position);
    }
  });

  return positionByParagraphIndex;
}
