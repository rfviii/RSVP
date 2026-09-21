export const PUNCTUATION_TYPES = [
  'none',
  'comma',
  'semicolon',
  'colon',
  'dash',
  'sentenceEnd',
  'paragraphEnd',
] as const;

export type PunctuationType = (typeof PUNCTUATION_TYPES)[number];

export interface Token {
  id: string;
  text: string;
  index: number;
  sentenceIndex: number;
  paragraphIndex: number;
  punctuation: PunctuationType;
}

export interface Sentence {
  id: string;
  tokens: Token[];
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface TextDocument {
  paragraphs: Paragraph[];
}
