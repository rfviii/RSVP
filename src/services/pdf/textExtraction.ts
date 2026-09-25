import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfProcessingError } from '@/services/pdf/errors';
import type { PdfExtractionResult, PdfPageText } from '@/services/pdf/types';

/**
 * A gap between two lines' baselines is treated as a paragraph break once it
 * exceeds the page's typical single-line gap by this factor. pdf.js's
 * `hasEOL` fires identically for an ordinary wrapped line and for a real
 * paragraph break, so the vertical gap between baselines is what actually
 * distinguishes them.
 */
const PARAGRAPH_GAP_MULTIPLIER = 1.35;

/**
 * How far right of the page's left margin a line has to start before it
 * counts as an indented paragraph start, in PDF user-space units (roughly
 * points). Generous enough to ignore normal kerning/rounding jitter, small
 * enough to catch a typical ~0.25"-0.5" first-line indent.
 */
const INDENT_THRESHOLD = 8;

/** Below this many line-to-line gaps there isn't enough data to trust a "typical" gap, so every break is treated as a plain wrap. */
const MIN_GAPS_FOR_BASELINE = 3;

interface VisualLine {
  text: string;
  x: number;
  y: number;
}

/**
 * How big the horizontal gap between two text items has to be, relative to
 * the previous item's own average character width, before it counts as a
 * real word-separating space rather than normal kerning between adjacent
 * glyphs. PDF generators frequently emit punctuation (e.g. "?", "!") as its
 * own text item right after a word, with zero gap — treating every item
 * boundary as a space (the old behavior) turns "alive?!" into "alive ? !".
 */
const SPACE_GAP_RATIO = 0.3;

/** pdf.js's text transform is `[scaleX, skewX, skewY, scaleY, x, y]`. */
function getItemPosition(item: { transform?: unknown }): { x: number; y: number } | null {
  const transform = item.transform;
  if (!Array.isArray(transform) || typeof transform[4] !== 'number' || typeof transform[5] !== 'number') {
    return null;
  }
  return { x: transform[4], y: transform[5] };
}

/**
 * Decides whether a space belongs between two consecutive text items on the
 * same line, from their actual layout rather than assuming one always does.
 * Falls back to "yes" (the old, safe default) when there's no usable
 * position/width data to reason about.
 */
function needsSpaceBetween(
  previous: { x: number; width: number; str: string },
  current: { x: number },
): boolean {
  if (previous.str.length === 0) {
    return false;
  }
  const averageCharWidth = previous.width / previous.str.length;
  if (!(averageCharWidth > 0)) {
    return true;
  }
  const gap = current.x - (previous.x + previous.width);
  return gap > averageCharWidth * SPACE_GAP_RATIO;
}

function median(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const middleValue = sorted[mid] ?? 0;
  const beforeMiddleValue = sorted[mid - 1] ?? middleValue;
  return sorted.length % 2 === 0 ? (beforeMiddleValue + middleValue) / 2 : middleValue;
}

/**
 * Groups a page's text items into visual lines (pdf.js already marks line
 * ends via `hasEOL`), keeping each line's starting position so paragraph
 * boundaries can be detected from real layout, not just presence of a line
 * break.
 */
function groupItemsIntoLines(items: readonly unknown[]): VisualLine[] {
  const lines: VisualLine[] = [];
  let currentText = '';
  let currentStart: { x: number; y: number } | null = null;
  let previousItem: { x: number; width: number; str: string } | null = null;

  for (const rawItem of items) {
    if (typeof rawItem !== 'object' || rawItem === null || !('str' in rawItem)) {
      continue;
    }
    const item = rawItem as { str: string; hasEOL?: boolean; transform?: unknown; width?: unknown };
    const position = getItemPosition(item);

    if (currentStart === null) {
      currentStart = position;
    }

    if (previousItem && (position === null || needsSpaceBetween(previousItem, position))) {
      currentText += ' ';
    }
    currentText += item.str;

    if (item.hasEOL) {
      lines.push({ text: currentText, x: currentStart?.x ?? 0, y: currentStart?.y ?? 0 });
      currentText = '';
      currentStart = null;
      previousItem = null;
    } else if (item.str.length > 0) {
      previousItem = position
        ? { x: position.x, width: typeof item.width === 'number' ? item.width : 0, str: item.str }
        : null;
    }
  }

  if (currentText.trim().length > 0) {
    lines.push({ text: currentText, x: currentStart?.x ?? 0, y: currentStart?.y ?? 0 });
  }

  return lines;
}

/**
 * Joins a page's visual lines back into text, inserting a paragraph break
 * (double newline) where the vertical gap to the previous line is
 * unusually large, or the line starts markedly indented from the page's
 * left margin — either is a real layout signal for "new paragraph", unlike
 * `hasEOL` which fires for every wrapped line too. Falls back to treating
 * every break as a plain line wrap when there's no usable position data
 * (e.g. too few lines to establish a baseline), which preserves the
 * original behavior rather than guessing.
 */
export function joinLinesWithParagraphBreaks(rawLines: VisualLine[]): string {
  const lines = rawLines
    .map((line) => ({ ...line, text: line.text.replace(/[ \t]+/g, ' ').trim() }))
    .filter((line) => line.text.length > 0);

  if (lines.length === 0) {
    return '';
  }

  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const previousLine = lines[i - 1];
    const currentLine = lines[i];
    if (!previousLine || !currentLine) {
      continue;
    }
    const gap = previousLine.y - currentLine.y;
    if (gap > 0) {
      gaps.push(gap);
    }
  }
  const typicalLineGap = gaps.length >= MIN_GAPS_FOR_BASELINE ? median(gaps) : 0;
  const leftMargin = Math.min(...lines.map((line) => line.x));

  let result = lines[0]?.text ?? '';
  for (let i = 1; i < lines.length; i += 1) {
    const previous = lines[i - 1];
    const current = lines[i];
    if (!previous || !current) {
      continue;
    }
    const gap = previous.y - current.y;

    const isLargeGap = typicalLineGap > 0 && gap > typicalLineGap * PARAGRAPH_GAP_MULTIPLIER;
    const isIndented = typicalLineGap > 0 && current.x > leftMargin + INDENT_THRESHOLD;

    result += (isLargeGap || isIndented ? '\n\n' : '\n') + current.text;
  }

  return result;
}

async function extractPageText(document: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();

  const lines = groupItemsIntoLines(content.items);
  return joinLinesWithParagraphBreaks(lines);
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
