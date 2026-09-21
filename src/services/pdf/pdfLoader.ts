import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfProcessingError } from '@/services/pdf/errors';

// A real Worker is only available in browsers. In Node-based test runs
// (jsdom has no Worker global) pdfjs-dist falls back to its own
// Node-compatible in-process worker and resolves the script itself.
if (typeof Worker !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data });
    return await loadingTask.promise;
  } catch (error) {
    throw new PdfProcessingError(
      'corrupted-pdf',
      'This PDF could not be opened. It may be corrupted or password-protected.',
      { cause: error },
    );
  }
}
