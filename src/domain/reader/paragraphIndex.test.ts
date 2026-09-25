import { describe, expect, it } from 'vitest';
import { buildParagraphPositionIndex } from '@/domain/reader/paragraphIndex';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

describe('buildParagraphPositionIndex', () => {
  it('maps each paragraph position to its own paragraphIndex when there are no gaps', () => {
    const index = buildParagraphPositionIndex(sampleTextDocument);

    expect(index.get(0)).toBe(0);
    expect(index.get(1)).toBe(1);
  });

  it('returns an empty map for a document with no paragraphs', () => {
    expect(buildParagraphPositionIndex({ paragraphs: [] }).size).toBe(0);
  });
});
