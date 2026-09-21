import { PUNCTUATION_TYPES, type PunctuationType } from '@/domain/text/types';

export function isPunctuationType(value: unknown): value is PunctuationType {
  return typeof value === 'string' && (PUNCTUATION_TYPES as readonly string[]).includes(value);
}
