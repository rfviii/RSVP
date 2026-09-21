import type { Paragraph, Sentence, Token, TextDocument } from '@/domain/text/types';

function createToken(
  text: string,
  index: number,
  sentenceIndex: number,
  paragraphIndex: number,
  punctuation: Token['punctuation'] = 'none',
): Token {
  return {
    id: `token-${index}`,
    text,
    index,
    sentenceIndex,
    paragraphIndex,
    punctuation,
  };
}

function createSentence(id: string, tokens: Token[]): Sentence {
  return { id, tokens };
}

function createParagraph(id: string, sentences: Sentence[]): Paragraph {
  return { id, sentences };
}

/**
 * A small, hand-built TextDocument used across tests until the real
 * normalization/tokenization pipeline (Phase 4) can produce fixtures.
 */
export const sampleTextDocument: TextDocument = {
  paragraphs: [
    createParagraph('paragraph-0', [
      createSentence('sentence-0', [
        createToken('The', 0, 0, 0),
        createToken('quick', 1, 0, 0),
        createToken('fox', 2, 0, 0, 'sentenceEnd'),
      ]),
      createSentence('sentence-1', [
        createToken('It', 3, 1, 0),
        createToken('jumps,', 4, 1, 0, 'comma'),
        createToken('runs', 5, 1, 0, 'paragraphEnd'),
      ]),
    ]),
    createParagraph('paragraph-1', [
      createSentence('sentence-2', [
        createToken('Next', 6, 0, 1),
        createToken('paragraph', 7, 0, 1, 'sentenceEnd'),
      ]),
    ]),
  ],
};
