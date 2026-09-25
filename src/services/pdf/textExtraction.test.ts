import type { PDFDocumentProxy } from 'pdfjs-dist';
import { describe, expect, it } from 'vitest';
import { PdfProcessingError } from '@/services/pdf/errors';
import { extractPdfText, joinLinesWithParagraphBreaks } from '@/services/pdf/textExtraction';

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

/** A line of text at a given left margin `x`, `y` baseline units down from the previous line's `y`. */
function line(text: string, x: number, y: number) {
  return { str: text, hasEOL: true, transform: [1, 0, 0, 1, x, y] };
}

function makeDocumentFromItems(items: unknown[]): PDFDocumentProxy {
  return {
    numPages: 1,
    getPage: async () => ({
      getTextContent: async () => ({ items }),
    }),
  } as unknown as PDFDocumentProxy;
}

/** A single PDF text item within a line: real x/width, so word-gap vs adjacent-glyph spacing can be tested. */
function chunk(text: string, x: number, y: number, width: number, hasEOL = false) {
  return { str: text, hasEOL, transform: [1, 0, 0, 1, x, y], width };
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

  it('marks a real paragraph gap with a double line break instead of treating it as just another wrapped line', async () => {
    // Standard body-text left margin is x=72. Normal line spacing is 14
    // units. A real paragraph gap (extra leading between paragraphs) is
    // much larger than a wrapped-line gap, so downstream normalization
    // (which treats "\n\n" as a paragraph boundary) can tell them apart.
    const document = makeDocumentFromItems([
      line('It was a quiet morning', 72, 700),
      line('when the letter arrived,', 72, 686),
      line('The person walked through the room', 72, 672),
      line('and looked around carefully.', 72, 658), // normal wrap: gap 14
      line('He then opened the door.', 72, 628), // paragraph gap: 30 (>> 14)
    ]);

    const result = await extractPdfText(document);

    expect(result.pages[0]?.text).toBe(
      'It was a quiet morning\nwhen the letter arrived,\nThe person walked through the room\nand looked around carefully.\n\nHe then opened the door.',
    );
  });

  it('detects a paragraph break from first-line indentation even without an unusually large gap', async () => {
    const document = makeDocumentFromItems([
      line('It was a quiet morning', 72, 700),
      line('when the letter arrived.', 72, 686),
      line('First paragraph line one', 72, 672),
      line('first paragraph line two.', 72, 658), // gap 14, no indent -> wrap
      line('Second paragraph, indented.', 100, 644), // gap 14 (same), but indented -> new paragraph
    ]);

    const result = await extractPdfText(document);

    expect(result.pages[0]?.text).toBe(
      'It was a quiet morning\nwhen the letter arrived.\nFirst paragraph line one\nfirst paragraph line two.\n\nSecond paragraph, indented.',
    );
  });

  describe('word spacing from PDF text items', () => {
    it('does not insert a space between a word and punctuation the PDF emits as a separate, touching text item', async () => {
      // Real-world PDFs commonly emit trailing punctuation as its own text
      // item right after a word, with no gap — "alive" ends at x=72+30=102,
      // "?" starts at x=102 (zero gap), "!" starts at x=109 (zero gap).
      // Naively treating every item boundary as a space turned this into
      // "alive ? !" instead of "alive?!".
      const document = makeDocumentFromItems([
        chunk('How could a person survive', 72, 700, 150),
        chunk('alive', 72, 686, 30),
        chunk('?', 102, 686, 7),
        chunk('!', 109, 686, 7, true),
      ]);

      const result = await extractPdfText(document);

      expect(result.pages[0]?.text).toContain('alive?!');
      expect(result.pages[0]?.text).not.toMatch(/alive\s\?/);
      expect(result.pages[0]?.text).not.toMatch(/\?\s!/);
    });

    it('still inserts a space between two word items separated by a real horizontal gap', async () => {
      const document = makeDocumentFromItems([
        chunk('Hello', 72, 700, 30), // ends at x=102
        chunk('world', 110, 700, 30, true), // starts at x=110 -> gap 8, a real word gap
      ]);

      const result = await extractPdfText(document);

      expect(result.pages[0]?.text).toBe('Hello world');
    });

    it('falls back to inserting a space when a text item has no usable width data', async () => {
      const document = makeDocumentFromItems([
        { str: 'Hello', hasEOL: false, transform: [1, 0, 0, 1, 72, 700] },
        { str: 'world', hasEOL: true, transform: [1, 0, 0, 1, 120, 700] },
      ]);

      const result = await extractPdfText(document);

      expect(result.pages[0]?.text).toBe('Hello world');
    });
  });
});

describe('joinLinesWithParagraphBreaks', () => {
  it('joins lines with a consistent single-line-height gap using a plain line break', () => {
    const result = joinLinesWithParagraphBreaks([
      { text: 'Line one', x: 72, y: 700 },
      { text: 'line two', x: 72, y: 686 },
      { text: 'line three', x: 72, y: 672 },
      { text: 'line four', x: 72, y: 658 },
    ]);

    expect(result).toBe('Line one\nline two\nline three\nline four');
  });

  it('treats a markedly larger gap than the established baseline as a paragraph break', () => {
    const result = joinLinesWithParagraphBreaks([
      { text: 'Paragraph one, line one', x: 72, y: 700 },
      { text: 'line two.', x: 72, y: 686 },
      { text: 'line three.', x: 72, y: 672 },
      { text: 'Paragraph two.', x: 72, y: 630 }, // gap 42 vs baseline 14
    ]);

    expect(result).toBe('Paragraph one, line one\nline two.\nline three.\n\nParagraph two.');
  });

  it('falls back to plain line breaks when there is not enough data to establish a baseline gap', () => {
    const result = joinLinesWithParagraphBreaks([
      { text: 'Only', x: 72, y: 700 },
      { text: 'two lines', x: 72, y: 600 },
    ]);

    expect(result).toBe('Only\ntwo lines');
  });

  it('drops blank lines instead of turning them into stray paragraph breaks', () => {
    const result = joinLinesWithParagraphBreaks([
      { text: 'Line one', x: 72, y: 700 },
      { text: '   ', x: 72, y: 686 },
      { text: 'line two', x: 72, y: 672 },
    ]);

    expect(result).toBe('Line one\nline two');
  });

  it('returns an empty string for no lines', () => {
    expect(joinLinesWithParagraphBreaks([])).toBe('');
  });
});
