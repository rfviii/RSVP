import { describe, expect, it } from 'vitest';
import { importPdfFile } from '@/services/pdf/importPdf';
import { processExtractedPages } from '@/domain/text/pipeline';
import { loadFixtureFile } from '@/tests/helpers/loadFixtureFile';

describe('processExtractedPages (integration with real PDF extraction)', () => {
  it('turns a real extracted PDF into a readable token stream', async () => {
    const file = loadFixtureFile('sample.pdf', 'application/pdf');
    const extraction = await importPdfFile(file);

    const document = processExtractedPages(extraction.pages);

    const words = document.paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.tokens.map((t) => t.text)));

    expect(words).toEqual(['Hello', 'World']);
    expect(document.paragraphs[0]?.sentences[0]?.tokens.at(-1)?.punctuation).toBe('paragraphEnd');
  });
});
