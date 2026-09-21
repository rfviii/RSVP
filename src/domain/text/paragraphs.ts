/** Splits already-normalized text (paragraphs separated by a blank line) into paragraph strings. */
export function splitIntoParagraphs(normalizedText: string): string[] {
  return normalizedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
