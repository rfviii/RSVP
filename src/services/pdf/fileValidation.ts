import { PdfProcessingError } from '@/services/pdf/errors';

const PDF_MIME_TYPE = 'application/pdf';
const PDF_EXTENSION_PATTERN = /\.pdf$/i;

export function assertSupportedPdfFile(file: File): void {
  if (file.size === 0) {
    throw new PdfProcessingError('invalid-file', 'The selected file is empty.');
  }

  const looksLikePdf = file.type === PDF_MIME_TYPE || PDF_EXTENSION_PATTERN.test(file.name);

  if (!looksLikePdf) {
    throw new PdfProcessingError(
      'unsupported-file-type',
      `"${file.name}" does not appear to be a PDF file.`,
    );
  }
}
