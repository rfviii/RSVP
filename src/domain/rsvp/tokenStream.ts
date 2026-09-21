import type { TextDocument, Token } from '@/domain/text/types';

/** Flattens a paragraph/sentence tree into the ordered token list the engine plays through. */
export function flattenTextDocumentTokens(document: TextDocument): Token[] {
  return document.paragraphs.flatMap((paragraph) =>
    paragraph.sentences.flatMap((sentence) => sentence.tokens),
  );
}
