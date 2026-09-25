import type { Paragraph, Sentence, Token, TextDocument } from '@/domain/text/types';

function createToken(
  text: string,
  index: number,
  sentenceIndex: number,
  paragraphIndex: number,
  pageNumber: number,
  punctuation: Token['punctuation'] = 'none',
  trailingText = '',
): Token {
  return {
    id: `token-${index}`,
    text,
    index,
    sentenceIndex,
    paragraphIndex,
    punctuation,
    trailingText,
    pageNumber,
  };
}

function createSentence(id: string, tokens: Token[]): Sentence {
  return { id, tokens };
}

function createParagraph(id: string, sentences: Sentence[], pageNumber: number): Paragraph {
  return { id, sentences, pageNumber };
}

/**
 * A small, hand-built TextDocument used across tests until the real
 * normalization/tokenization pipeline (Phase 4) can produce fixtures.
 * Deliberately spans two pages so page-aware assertions have something
 * real to check.
 */
export const sampleTextDocument: TextDocument = {
  paragraphs: [
    createParagraph(
      'paragraph-0',
      [
        createSentence('sentence-0', [
          createToken('The', 0, 0, 0, 1),
          createToken('quick', 1, 0, 0, 1),
          createToken('fox', 2, 0, 0, 1, 'sentenceEnd', '.'),
        ]),
        createSentence('sentence-1', [
          createToken('It', 3, 1, 0, 1),
          createToken('jumps', 4, 1, 0, 1, 'comma', ','),
          createToken('runs', 5, 1, 0, 1, 'paragraphEnd', '.'),
        ]),
      ],
      1,
    ),
    createParagraph(
      'paragraph-1',
      [
        createSentence('sentence-2', [
          createToken('Next', 6, 0, 1, 2),
          createToken('paragraph', 7, 0, 1, 2, 'sentenceEnd', '.'),
        ]),
      ],
      2,
    ),
  ],
};
