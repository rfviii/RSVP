import type { PDFDocumentProxy } from 'pdfjs-dist';
import { describe, expect, it } from 'vitest';
import { PdfProcessingError } from '@/services/pdf/errors';
import { extractPdfText } from '@/services/pdf/textExtraction';

function makeFakeDocument(pageTexts: string[]): PDFDocumentProxy {
  return {
    numPages: pageTexts.length,
    getPage: async (pageNumber: number) => ({
      getTextContent: async () => ({
        items: [{ str: pageTexts[pageNumber - 1] ?? '' }],
      }),
    }),
  } as unknown as PDFDocumentProxy;
}

describe('extractPdfText', () => {
  it('collects text page by page in order', async () => {
    const document = makeFakeDocument(['First page.', 'Second page.']);

    const result = await extractPdfText(document);

    expect(result.pageCount).toBe(2);
    expect(result.pages).toEqual([
      { pageNumber: 1, text: 'First page.' },
      { pageNumber: 2, text: 'Second page.' },
    ]);
  });

  it('detects a document with no extractable text', async () => {
    const document = makeFakeDocument(['', '   ']);

    await expect(extractPdfText(document)).rejects.toMatchObject({
      code: 'no-extractable-text',
    });
    await expect(extractPdfText(document)).rejects.toBeInstanceOf(PdfProcessingError);
  });
});
