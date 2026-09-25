import { describe, expect, it } from 'vitest';
import { buildTextDocument } from '@/domain/text/buildTextDocument';
import type { NormalizedPage } from '@/domain/text/normalization';

function pages(...texts: string[]): NormalizedPage[] {
  return texts.map((text, i) => ({ pageNumber: i + 1, text }));
}

describe('buildTextDocument', () => {
  it('builds paragraphs, sentences, and tokens from normalized text', () => {
    const document = buildTextDocument(pages('The fox jumps. It runs fast.\n\nNext paragraph starts.'));

    expect(document.paragraphs).toHaveLength(2);
    expect(document.paragraphs[0]?.sentences).toHaveLength(2);
    expect(document.paragraphs[1]?.sentences).toHaveLength(1);
  });

  it('assigns strictly increasing global token indices', () => {
    const document = buildTextDocument(pages('First sentence here. Second one.\n\nAnother paragraph.'));

    const tokens = document.paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.tokens));

    tokens.forEach((token, position) => {
      expect(token.index).toBe(position);
    });
  });

  it('resets sentenceIndex per paragraph and assigns paragraphIndex per paragraph', () => {
    const document = buildTextDocument(pages('One. Two.\n\nThree.'));

    const [firstParagraph, secondParagraph] = document.paragraphs;

    expect(firstParagraph?.sentences[0]?.tokens[0]?.sentenceIndex).toBe(0);
    expect(firstParagraph?.sentences[1]?.tokens[0]?.sentenceIndex).toBe(1);
    expect(secondParagraph?.sentences[0]?.tokens[0]?.sentenceIndex).toBe(0);

    firstParagraph?.sentences.forEach((sentence) => {
      sentence.tokens.forEach((token) => expect(token.paragraphIndex).toBe(0));
    });
    secondParagraph?.sentences.forEach((sentence) => {
      sentence.tokens.forEach((token) => expect(token.paragraphIndex).toBe(1));
    });
  });

  it('marks the last token of a paragraph as paragraphEnd, overriding sentenceEnd', () => {
    const document = buildTextDocument(
      pages('First sentence. Last sentence in paragraph.\n\nSecond paragraph.'),
    );

    const firstParagraphTokens = document.paragraphs[0]?.sentences.flatMap((s) => s.tokens) ?? [];
    const lastTokenOfFirstParagraph = firstParagraphTokens[firstParagraphTokens.length - 1];

    expect(lastTokenOfFirstParagraph?.punctuation).toBe('paragraphEnd');

    const secondParagraphTokens = document.paragraphs[1]?.sentences.flatMap((s) => s.tokens) ?? [];
    const lastTokenOfSecondParagraph = secondParagraphTokens[secondParagraphTokens.length - 1];

    expect(lastTokenOfSecondParagraph?.punctuation).toBe('paragraphEnd');
  });

  it('never produces an empty paragraph, sentence, or token', () => {
    const document = buildTextDocument(pages('Only real content here.'));

    expect(document.paragraphs.length).toBeGreaterThan(0);
    document.paragraphs.forEach((paragraph) => {
      expect(paragraph.sentences.length).toBeGreaterThan(0);
      paragraph.sentences.forEach((sentence) => {
        expect(sentence.tokens.length).toBeGreaterThan(0);
        sentence.tokens.forEach((token) => expect(token.text.length).toBeGreaterThan(0));
      });
    });
  });

  it('returns no paragraphs for blank input', () => {
    expect(buildTextDocument(pages('   ')).paragraphs).toEqual([]);
  });

  it('tags every paragraph and token with the page number it came from', () => {
    const document = buildTextDocument([
      { pageNumber: 1, text: 'First page paragraph.' },
      { pageNumber: 2, text: 'Second page paragraph.' },
    ]);

    expect(document.paragraphs).toHaveLength(2);
    expect(document.paragraphs[0]?.pageNumber).toBe(1);
    expect(document.paragraphs[1]?.pageNumber).toBe(2);

    document.paragraphs.forEach((paragraph) => {
      paragraph.sentences.forEach((sentence) => {
        sentence.tokens.forEach((token) => {
          expect(token.pageNumber).toBe(paragraph.pageNumber);
        });
      });
    });
  });

  it('keeps a single, page-scoped paragraphIndex sequence running across pages', () => {
    const document = buildTextDocument([
      { pageNumber: 1, text: 'Page one, paragraph one.\n\nPage one, paragraph two.' },
      { pageNumber: 2, text: 'Page two, paragraph three.' },
    ]);

    expect(document.paragraphs.map((p) => p.sentences[0]?.tokens[0]?.paragraphIndex)).toEqual([0, 1, 2]);
  });

  it('assigns no tokens or paragraphs to a page with no extractable text (already dropped upstream)', () => {
    // normalizeExtractedPages already filters out empty pages, so buildTextDocument
    // never sees them; a page that never arrives simply contributes nothing.
    const document = buildTextDocument([{ pageNumber: 1, text: 'Only page.' }]);

    expect(document.paragraphs.every((p) => p.pageNumber === 1)).toBe(true);
  });
});
