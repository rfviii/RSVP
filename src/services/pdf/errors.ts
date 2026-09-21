export const PDF_ERROR_CODES = [
  'invalid-file',
  'unsupported-file-type',
  'corrupted-pdf',
  'no-extractable-text',
  'no-readable-words',
  'extraction-failed',
] as const;

export type PdfErrorCode = (typeof PDF_ERROR_CODES)[number];

export class PdfProcessingError extends Error {
  readonly code: PdfErrorCode;

  constructor(code: PdfErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PdfProcessingError';
    this.code = code;
  }
}
