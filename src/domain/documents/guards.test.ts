import { describe, expect, it } from 'vitest';
import { isDocumentType } from '@/domain/documents/guards';

describe('isDocumentType', () => {
  it('accepts supported document types', () => {
    expect(isDocumentType('pdf')).toBe(true);
  });

  it('rejects unsupported or malformed values', () => {
    expect(isDocumentType('epub')).toBe(false);
    expect(isDocumentType('')).toBe(false);
    expect(isDocumentType(null)).toBe(false);
    expect(isDocumentType(42)).toBe(false);
  });
});
