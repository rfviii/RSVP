import { describe, expect, it } from 'vitest';
import { tokenizeSentence } from '@/domain/text/tokenize';

describe('tokenizeSentence', () => {
  it('splits plain words and marks the final sentence-ending punctuation', () => {
    expect(tokenizeSentence('The quick fox jumps.')).toEqual([
      { text: 'The', punctuation: 'none', trailingText: '' },
      { text: 'quick', punctuation: 'none', trailingText: '' },
      { text: 'fox', punctuation: 'none', trailingText: '' },
      { text: 'jumps', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('classifies a comma', () => {
    expect(tokenizeSentence('First, second, third.')).toEqual([
      { text: 'First', punctuation: 'comma', trailingText: ',' },
      { text: 'second', punctuation: 'comma', trailingText: ',' },
      { text: 'third', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('classifies a semicolon and a colon', () => {
    expect(tokenizeSentence('One; two: three.')).toEqual([
      { text: 'One', punctuation: 'semicolon', trailingText: ';' },
      { text: 'two', punctuation: 'colon', trailingText: ':' },
      { text: 'three', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('keeps a contraction as one token', () => {
    expect(tokenizeSentence("It's ready.")).toEqual([
      { text: "It's", punctuation: 'none', trailingText: '' },
      { text: 'ready', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('keeps a hyphenated compound as one token', () => {
    expect(tokenizeSentence('A well-known fact.')).toEqual([
      { text: 'A', punctuation: 'none', trailingText: '' },
      { text: 'well-known', punctuation: 'none', trailingText: '' },
      { text: 'fact', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('keeps a decimal number as one token', () => {
    expect(tokenizeSentence('Pi is 3.14 roughly.')).toEqual([
      { text: 'Pi', punctuation: 'none', trailingText: '' },
      { text: 'is', punctuation: 'none', trailingText: '' },
      { text: '3.14', punctuation: 'none', trailingText: '' },
      { text: 'roughly', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('keeps a thousand-separated number as one token', () => {
    expect(tokenizeSentence('It cost 1,000 dollars.')).toEqual([
      { text: 'It', punctuation: 'none', trailingText: '' },
      { text: 'cost', punctuation: 'none', trailingText: '' },
      { text: '1,000', punctuation: 'none', trailingText: '' },
      { text: 'dollars', punctuation: 'sentenceEnd', trailingText: '.' },
    ]);
  });

  it('classifies a quoted sentence ending while keeping the literal quotes for display', () => {
    expect(tokenizeSentence('He said "stop."')).toEqual([
      { text: 'He', punctuation: 'none', trailingText: '' },
      { text: 'said', punctuation: 'none', trailingText: '"' },
      { text: 'stop', punctuation: 'sentenceEnd', trailingText: '."' },
    ]);
  });

  it('never produces an empty token', () => {
    const tokens = tokenizeSentence('   ...   ');
    expect(tokens.every((token) => token.text.length > 0)).toBe(true);
  });
});
