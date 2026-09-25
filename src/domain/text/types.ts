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
  /** The literal text right after this word (e.g. ",", ".", "!", `."`), for faithful rendering. */
  trailingText: string;
  /** The 1-based PDF page this token came from. */
  pageNumber: number;
}

export interface Sentence {
  id: string;
  tokens: Token[];
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
  /** The 1-based PDF page this paragraph came from. A paragraph never spans two pages. */
  pageNumber: number;
}

export interface TextDocument {
  paragraphs: Paragraph[];
}
