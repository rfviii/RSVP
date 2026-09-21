import { describe, expect, it } from 'vitest';
import { importPdfFile } from '@/services/pdf/importPdf';
import { PdfProcessingError } from '@/services/pdf/errors';
import { loadFixtureFile } from '@/tests/helpers/loadFixtureFile';

describe('importPdfFile', () => {
  it('extracts text from a normal text-based PDF', async () => {
    const file = loadFixtureFile('sample.pdf', 'application/pdf');

    const result = await importPdfFile(file);

    expect(result.pageCount).toBe(1);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0]?.text).toContain('Hello World');
  });

  it('rejects a file that is not a PDF before attempting to load it', async () => {
    const file = loadFixtureFile('not-a-pdf.txt', 'text/plain');

    await expect(importPdfFile(file)).rejects.toMatchObject({
      code: 'unsupported-file-type',
    });
  });

  it('reports a corrupted PDF as unopenable rather than crashing', async () => {
    const file = loadFixtureFile('corrupted.pdf', 'application/pdf');

    const rejection = importPdfFile(file);

    await expect(rejection).rejects.toBeInstanceOf(PdfProcessingError);
    await expect(rejection).rejects.toMatchObject({ code: 'corrupted-pdf' });
  });
});
