import { describe, expect, it } from 'vitest';
import { processExtractedPages } from '@/domain/text/pipeline';

function buildSyntheticBook(paragraphCount: number, sentencesPerParagraph: number): string {
  const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'reading', 'quickly'];
  const paragraphs: string[] = [];

  for (let p = 0; p < paragraphCount; p += 1) {
    const sentences: string[] = [];
    for (let s = 0; s < sentencesPerParagraph; s += 1) {
      const sentenceWords = Array.from({ length: 12 }, (_, i) => words[(p + s + i) % words.length]);
      sentences.push(`${sentenceWords.join(' ')}.`);
    }
    paragraphs.push(sentences.join(' '));
  }

  return paragraphs.join('\n\n');
}

describe('processExtractedPages performance', () => {
  /**
   * A regression guard, not a benchmark: a ~420,000-token document (the
   * scale of a real ~2000-page novel) should still process well under a
   * second on typical hardware. A generous ceiling avoids flakiness while
   * still catching an accidental non-linear slowdown in the pipeline.
   */
  it('processes a book-scale (~420,000 token) document without a runaway slowdown', () => {
    const text = buildSyntheticBook(7000, 5);

    const start = performance.now();
    const result = processExtractedPages([{ pageNumber: 1, text }]);
    const elapsedMs = performance.now() - start;

    const tokenCount = result.paragraphs.reduce(
      (sum, paragraph) =>
        sum + paragraph.sentences.reduce((sSum, sentence) => sSum + sentence.tokens.length, 0),
      0,
    );

    expect(tokenCount).toBeGreaterThan(400_000);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
