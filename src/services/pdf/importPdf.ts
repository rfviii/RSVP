import { PdfProcessingError } from '@/services/pdf/errors';
import { assertSupportedPdfFile } from '@/services/pdf/fileValidation';
import { loadPdfDocument } from '@/services/pdf/pdfLoader';
import { extractPdfText } from '@/services/pdf/textExtraction';
import type { PdfExtractionResult } from '@/services/pdf/types';

/**
 * Reads via FileReader rather than Blob.arrayBuffer(): the latter is
 * unimplemented in jsdom, and FileReader works identically in real browsers.
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

export async function importPdfFile(file: File): Promise<PdfExtractionResult> {
  assertSupportedPdfFile(file);

  let data: ArrayBuffer;
  try {
    data = await readFileAsArrayBuffer(file);
  } catch (error) {
    throw new PdfProcessingError('invalid-file', 'The selected file could not be read.', {
      cause: error,
    });
  }

  const document = await loadPdfDocument(data);

  try {
    return await extractPdfText(document);
  } finally {
    await document.destroy();
  }
}
