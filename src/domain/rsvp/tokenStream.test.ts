import { describe, expect, it } from 'vitest';
import { flattenTextDocumentTokens } from '@/domain/rsvp/tokenStream';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

describe('flattenTextDocumentTokens', () => {
  it('flattens paragraphs and sentences into a single ordered token list', () => {
    const tokens = flattenTextDocumentTokens(sampleTextDocument);

    expect(tokens).toHaveLength(8);
    tokens.forEach((token, position) => {
      expect(token.index).toBe(position);
    });
  });

  it('returns an empty array for a document with no paragraphs', () => {
    expect(flattenTextDocumentTokens({ paragraphs: [] })).toEqual([]);
  });
});
