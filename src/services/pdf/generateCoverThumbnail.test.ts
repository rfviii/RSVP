import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateCoverThumbnail } from '@/services/pdf/generateCoverThumbnail';
import { importPdfFile } from '@/services/pdf/importPdf';
import { loadPdfDocument } from '@/services/pdf/pdfLoader';
import { loadFixtureFile } from '@/tests/helpers/loadFixtureFile';

function readFixtureArrayBuffer(fileName: string): ArrayBuffer {
  const buffer = readFileSync(path.resolve(process.cwd(), 'src/tests/fixtures', fileName));
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

describe('generateCoverThumbnail', () => {
  it('resolves to undefined instead of throwing when canvas rendering is unavailable (e.g. jsdom)', async () => {
    const pdfDocument = await loadPdfDocument(readFixtureArrayBuffer('sample.pdf'));

    try {
      await expect(generateCoverThumbnail(pdfDocument)).resolves.toBeUndefined();
    } finally {
      await pdfDocument.destroy();
    }
  });

  it('does not prevent a document from importing when the thumbnail cannot be generated', async () => {
    const file = loadFixtureFile('sample.pdf', 'application/pdf');

    const result = await importPdfFile(file);

    expect(result.pageCount).toBe(1);
    expect(result.coverThumbnail).toBeUndefined();
  });
});
