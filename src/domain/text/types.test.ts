import { describe, expect, it } from 'vitest';
import { isPunctuationType } from '@/domain/text/guards';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

function flattenTokens(document: typeof sampleTextDocument) {
  return document.paragraphs.flatMap((paragraph) =>
    paragraph.sentences.flatMap((sentence) => sentence.tokens),
  );
}

describe('TextDocument structure', () => {
  it('assigns strictly increasing global token indices', () => {
    const tokens = flattenTokens(sampleTextDocument);

    tokens.forEach((token, position) => {
      expect(token.index).toBe(position);
    });
  });

  it('assigns paragraph indices that match each token position', () => {
    sampleTextDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
      paragraph.sentences.forEach((sentence) => {
        sentence.tokens.forEach((token) => {
          expect(token.paragraphIndex).toBe(paragraphIndex);
        });
      });
    });
  });

  it('assigns sentence indices scoped to their paragraph', () => {
    sampleTextDocument.paragraphs.forEach((paragraph) => {
      paragraph.sentences.forEach((sentence, sentenceIndex) => {
        sentence.tokens.forEach((token) => {
          expect(token.sentenceIndex).toBe(sentenceIndex);
        });
      });
    });
  });

  it('never produces empty tokens', () => {
    const tokens = flattenTokens(sampleTextDocument);

    tokens.forEach((token) => {
      expect(token.text.length).toBeGreaterThan(0);
    });
  });

  it('only uses recognized punctuation values', () => {
    const tokens = flattenTokens(sampleTextDocument);

    tokens.forEach((token) => {
      expect(isPunctuationType(token.punctuation)).toBe(true);
    });
  });
});
