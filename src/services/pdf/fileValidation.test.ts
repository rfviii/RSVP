import { describe, expect, it } from 'vitest';
import { assertSupportedPdfFile } from '@/services/pdf/fileValidation';
import { PdfProcessingError } from '@/services/pdf/errors';

function makeFile(name: string, type: string, content = 'content'): File {
  return new File([content], name, { type });
}

describe('assertSupportedPdfFile', () => {
  it('accepts a file with the PDF mime type', () => {
    expect(() => assertSupportedPdfFile(makeFile('document.pdf', 'application/pdf'))).not.toThrow();
  });

  it('accepts a .pdf file even without a reliable mime type', () => {
    expect(() => assertSupportedPdfFile(makeFile('document.pdf', ''))).not.toThrow();
  });

  it('rejects an empty file', () => {
    const file = makeFile('document.pdf', 'application/pdf', '');

    expect(() => assertSupportedPdfFile(file)).toThrow(PdfProcessingError);
    try {
      assertSupportedPdfFile(file);
    } catch (error) {
      expect((error as PdfProcessingError).code).toBe('invalid-file');
    }
  });

  it('rejects a non-PDF file', () => {
    const file = makeFile('notes.txt', 'text/plain');

    expect(() => assertSupportedPdfFile(file)).toThrow(PdfProcessingError);
    try {
      assertSupportedPdfFile(file);
    } catch (error) {
      expect((error as PdfProcessingError).code).toBe('unsupported-file-type');
    }
  });
});
