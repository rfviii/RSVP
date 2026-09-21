import { describe, expect, it } from 'vitest';
import { tokenizeSentence } from '@/domain/text/tokenize';

describe('tokenizeSentence', () => {
  it('splits plain words and marks the final sentence-ending punctuation', () => {
    expect(tokenizeSentence('The quick fox jumps.')).toEqual([
      { text: 'The', punctuation: 'none' },
      { text: 'quick', punctuation: 'none' },
      { text: 'fox', punctuation: 'none' },
      { text: 'jumps', punctuation: 'sentenceEnd' },
    ]);
  });

  it('classifies a comma', () => {
    expect(tokenizeSentence('First, second, third.')).toEqual([
      { text: 'First', punctuation: 'comma' },
      { text: 'second', punctuation: 'comma' },
      { text: 'third', punctuation: 'sentenceEnd' },
    ]);
  });

  it('classifies a semicolon and a colon', () => {
    expect(tokenizeSentence('One; two: three.')).toEqual([
      { text: 'One', punctuation: 'semicolon' },
      { text: 'two', punctuation: 'colon' },
      { text: 'three', punctuation: 'sentenceEnd' },
    ]);
  });

  it('keeps a contraction as one token', () => {
    expect(tokenizeSentence("It's ready.")).toEqual([
      { text: "It's", punctuation: 'none' },
      { text: 'ready', punctuation: 'sentenceEnd' },
    ]);
  });

  it('keeps a hyphenated compound as one token', () => {
    expect(tokenizeSentence('A well-known fact.')).toEqual([
      { text: 'A', punctuation: 'none' },
      { text: 'well-known', punctuation: 'none' },
      { text: 'fact', punctuation: 'sentenceEnd' },
    ]);
  });

  it('keeps a decimal number as one token', () => {
    expect(tokenizeSentence('Pi is 3.14 roughly.')).toEqual([
      { text: 'Pi', punctuation: 'none' },
      { text: 'is', punctuation: 'none' },
      { text: '3.14', punctuation: 'none' },
      { text: 'roughly', punctuation: 'sentenceEnd' },
    ]);
  });

  it('keeps a thousand-separated number as one token', () => {
    expect(tokenizeSentence('It cost 1,000 dollars.')).toEqual([
      { text: 'It', punctuation: 'none' },
      { text: 'cost', punctuation: 'none' },
      { text: '1,000', punctuation: 'none' },
      { text: 'dollars', punctuation: 'sentenceEnd' },
    ]);
  });

  it('classifies a quoted sentence ending', () => {
    expect(tokenizeSentence('He said "stop."')).toEqual([
      { text: 'He', punctuation: 'none' },
      { text: 'said', punctuation: 'none' },
      { text: 'stop', punctuation: 'sentenceEnd' },
    ]);
  });

  it('never produces an empty token', () => {
    const tokens = tokenizeSentence('   ...   ');
    expect(tokens.every((token) => token.text.length > 0)).toBe(true);
  });
});
