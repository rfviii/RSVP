import { describe, expect, it } from 'vitest';
import { splitIntoParagraphs } from '@/domain/text/paragraphs';

describe('splitIntoParagraphs', () => {
  it('splits on a blank line', () => {
    expect(splitIntoParagraphs('First.\n\nSecond.')).toEqual(['First.', 'Second.']);
  });

  it('splits on multiple consecutive blank lines', () => {
    expect(splitIntoParagraphs('First.\n\n\nSecond.')).toEqual(['First.', 'Second.']);
  });

  it('trims each paragraph', () => {
    expect(splitIntoParagraphs('  First.  \n\n  Second.  ')).toEqual(['First.', 'Second.']);
  });

  it('drops empty paragraphs', () => {
    expect(splitIntoParagraphs('\n\nFirst.\n\n\n\nSecond.\n\n')).toEqual(['First.', 'Second.']);
  });

  it('returns a single paragraph when there is no blank line', () => {
    expect(splitIntoParagraphs('Just one paragraph of text.')).toEqual(['Just one paragraph of text.']);
  });

  it('returns an empty array for blank input', () => {
    expect(splitIntoParagraphs('   \n\n   ')).toEqual([]);
  });
});
