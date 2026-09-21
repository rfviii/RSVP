const PAGE_NUMBER_LINE_PATTERN = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i;
const MIN_PAGES_FOR_REPEATED_LINE_DETECTION = 3;

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function isLikelyPageNumberLine(line: string): boolean {
  return PAGE_NUMBER_LINE_PATTERN.test(line.trim());
}

/**
 * Removes lines that repeat verbatim across a majority of pages (running
 * headers/footers) plus standalone page-number lines. Deliberately
 * conservative: anything not confidently identified as an artifact is left
 * alone, per the spec's "do not aggressively delete text" rule.
 */
function removeRepeatedAndPageNumberLines(pages: string[]): string[] {
  const pageLineLists = pages.map((page) => page.split('\n'));

  if (pages.length < MIN_PAGES_FOR_REPEATED_LINE_DETECTION) {
    return pageLineLists
      .map((lines) => lines.filter((line) => !isLikelyPageNumberLine(line)))
      .map((lines) => lines.join('\n'));
  }

  const lineFrequency = new Map<string, number>();
  for (const lines of pageLineLists) {
    const uniqueLinesOnPage = new Set(lines.map((line) => line.trim()).filter(Boolean));
    for (const line of uniqueLinesOnPage) {
      lineFrequency.set(line, (lineFrequency.get(line) ?? 0) + 1);
    }
  }

  const majorityThreshold = pages.length / 2;
  const repeatedLines = new Set(
    [...lineFrequency.entries()]
      .filter(([, count]) => count > majorityThreshold)
      .map(([line]) => line),
  );

  return pageLineLists
    .map((lines) =>
      lines.filter((line) => !repeatedLines.has(line.trim()) && !isLikelyPageNumberLine(line)),
    )
    .map((lines) => lines.join('\n'));
}

const WRAP_HYPHENATION_PATTERN = /([\p{L}])-\n([\p{Ll}])/gu;

/** Rejoins a word split across a line-wrap hyphen, e.g. "exam-\nple" -> "example". */
function repairHyphenation(text: string): string {
  return text.replace(WRAP_HYPHENATION_PATTERN, '$1$2');
}

/**
 * Collapses single line-wrap breaks into a flowing paragraph while
 * preserving blank-line paragraph boundaries (2+ consecutive newlines). A
 * line ending in a hyphen that `repairHyphenation` didn't already resolve
 * (e.g. wrapping before an uppercase word) is joined without inserting a
 * space, since the hyphen is presumed to belong to the word/compound.
 */
function mergeLineWraps(text: string): string {
  return text.replace(
    /([^\n])\n(?!\n)([^\n])/g,
    (_match, before: string, after: string) => (before === '-' ? `${before}${after}` : `${before} ${after}`),
  );
}

function collapseHorizontalWhitespace(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

export interface RawPage {
  pageNumber: number;
  text: string;
}

/**
 * Turns raw per-page PDF text (with pdf.js line breaks preserved) into a
 * single normalized string: whitespace cleaned, hyphenation repaired,
 * repeated headers/footers and page numbers stripped, wrapped lines joined
 * into flowing paragraphs, and paragraph breaks preserved as blank lines.
 */
export function normalizeExtractedPages(pages: RawPage[]): string {
  const lineEndingsNormalized = pages.map((page) => normalizeLineEndings(page.text));
  const withoutArtifactLines = removeRepeatedAndPageNumberLines(lineEndingsNormalized);

  const flowingPages = withoutArtifactLines.map((pageText) => {
    const hyphenationRepaired = repairHyphenation(pageText);
    const wrapsMerged = mergeLineWraps(hyphenationRepaired);
    return collapseHorizontalWhitespace(wrapsMerged);
  });

  const joined = flowingPages.filter((page) => page.length > 0).join('\n\n');

  return collapseBlankLines(joined).trim();
}
