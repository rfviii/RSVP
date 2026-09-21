import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfProcessingError } from '@/services/pdf/errors';
import type { PdfExtractionResult, PdfPageText } from '@/services/pdf/types';

/**
 * Preserves pdf.js's per-line `hasEOL` boundaries as newlines instead of
 * collapsing a page to one line, so later normalization (Phase 4) can tell
 * a hard line break from a paragraph break.
 */
async function extractPageText(document: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();

  const lines: string[] = [];
  let currentLine = '';

  for (const item of content.items) {
    if (!('str' in item)) {
      continue;
    }

    currentLine += item.str;

    if (item.hasEOL) {
      lines.push(currentLine);
      currentLine = '';
    } else if (item.str.length > 0) {
      currentLine += ' ';
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  return lines
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
}

export async function extractPdfText(document: PDFDocumentProxy): Promise<PdfExtractionResult> {
  const pageCount = document.numPages;
  const pages: PdfPageText[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const text = await extractPageText(document, pageNumber);
      pages.push({ pageNumber, text });
    }
  } catch (error) {
    throw new PdfProcessingError(
      'extraction-failed',
      'Text could not be extracted from this PDF.',
      { cause: error },
    );
  }

  const hasExtractableText = pages.some((page) => page.text.length > 0);

  if (!hasExtractableText) {
    throw new PdfProcessingError(
      'no-extractable-text',
      'This document appears to contain no machine-readable text. Scanned documents are not supported yet.',
    );
  }

  return { pageCount, pages };
}
