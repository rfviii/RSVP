import { describe, expect, it } from 'vitest';
import { PdfProcessingError } from '@/services/pdf/errors';

describe('PdfProcessingError', () => {
  it('carries a machine-readable code alongside the message', () => {
    const error = new PdfProcessingError('corrupted-pdf', 'The PDF could not be opened.');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PdfProcessingError');
    expect(error.code).toBe('corrupted-pdf');
    expect(error.message).toBe('The PDF could not be opened.');
  });

  it('preserves the original cause for debugging', () => {
    const cause = new Error('underlying pdf.js failure');
    const error = new PdfProcessingError('extraction-failed', 'Extraction failed.', { cause });

    expect(error.cause).toBe(cause);
  });
});
