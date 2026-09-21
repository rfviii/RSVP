import { describe, expect, it } from 'vitest';
import { splitIntoSentences } from '@/domain/text/sentences';

describe('splitIntoSentences', () => {
  it('splits on a period followed by whitespace', () => {
    expect(splitIntoSentences('First sentence. Second sentence.')).toEqual([
      'First sentence.',
      'Second sentence.',
    ]);
  });

  it('splits on exclamation and question marks', () => {
    expect(splitIntoSentences('Really? Yes! Absolutely.')).toEqual(['Really?', 'Yes!', 'Absolutely.']);
  });

  it('does not split on a common abbreviation', () => {
    expect(splitIntoSentences('Dr. Smith arrived early.')).toEqual(['Dr. Smith arrived early.']);
  });

  it('does not split on a mid-sentence abbreviation like etc.', () => {
    expect(splitIntoSentences('Bring pens, paper, etc. to the meeting.')).toEqual([
      'Bring pens, paper, etc. to the meeting.',
    ]);
  });

  it('splits after a closing quotation mark that follows terminal punctuation', () => {
    expect(splitIntoSentences('He said "Stop." Then he left.')).toEqual([
      'He said "Stop."',
      'Then he left.',
    ]);
  });

  it('splits after a closing parenthesis that follows terminal punctuation', () => {
    expect(splitIntoSentences('This is true (probably.) Moving on.')).toEqual([
      'This is true (probably.)',
      'Moving on.',
    ]);
  });

  it('treats text with no terminal punctuation as a single sentence', () => {
    expect(splitIntoSentences('just a fragment of text')).toEqual(['just a fragment of text']);
  });

  it('returns an empty array for blank input', () => {
    expect(splitIntoSentences('   ')).toEqual([]);
  });
});
