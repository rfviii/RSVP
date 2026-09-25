import { describe, expect, it } from 'vitest';
import { normalizeExtractedPages, type RawPage } from '@/domain/text/normalization';

function page(pageNumber: number, text: string): RawPage {
  return { pageNumber, text };
}

describe('normalizeExtractedPages', () => {
  it('collapses horizontal whitespace runs', () => {
    const result = normalizeExtractedPages([page(1, 'Hello   there,\tfriend.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'Hello there, friend.' }]);
  });

  it('normalizes CRLF and CR line endings to LF-based paragraphs', () => {
    const result = normalizeExtractedPages([page(1, 'Line one.\r\n\r\nLine two.\rLine three.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'Line one.\n\nLine two. Line three.' }]);
  });

  it('joins a single line-wrap into flowing text without losing a word boundary', () => {
    const result = normalizeExtractedPages([page(1, 'This sentence wraps\nacross two lines.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'This sentence wraps across two lines.' }]);
  });

  it('preserves a blank-line paragraph boundary', () => {
    const result = normalizeExtractedPages([page(1, 'First paragraph.\n\nSecond paragraph.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'First paragraph.\n\nSecond paragraph.' }]);
  });

  it('collapses three or more blank lines to a single paragraph break', () => {
    const result = normalizeExtractedPages([page(1, 'First.\n\n\n\nSecond.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'First.\n\nSecond.' }]);
  });

  it('repairs a word wrapped across a hyphenated line break', () => {
    const result = normalizeExtractedPages([page(1, 'This is an exam-\nple of hyphenation.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'This is an example of hyphenation.' }]);
  });

  it('does not merge a genuine hyphenated compound followed by an uppercase word', () => {
    const result = normalizeExtractedPages([page(1, 'A well-\nKnown result follows.')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'A well-Known result follows.' }]);
  });

  it('keeps each page as its own separate entry, tagged with its page number', () => {
    const result = normalizeExtractedPages([page(1, 'End of page one.'), page(2, 'Start of page two.')]);

    expect(result).toEqual([
      { pageNumber: 1, text: 'End of page one.' },
      { pageNumber: 2, text: 'Start of page two.' },
    ]);
  });

  it('removes a standalone page-number line', () => {
    const result = normalizeExtractedPages([page(1, 'Some content.\n42')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'Some content.' }]);
  });

  it('removes a repeated running header across a majority of pages', () => {
    const pages = [
      page(1, 'RSVP Reader Manual\nChapter one content.'),
      page(2, 'RSVP Reader Manual\nChapter two content.'),
      page(3, 'RSVP Reader Manual\nChapter three content.'),
    ];

    const result = normalizeExtractedPages(pages);

    result.forEach((normalizedPage) => expect(normalizedPage.text).not.toContain('RSVP Reader Manual'));
    expect(result[0]?.text).toContain('Chapter one content.');
    expect(result[1]?.text).toContain('Chapter two content.');
    expect(result[2]?.text).toContain('Chapter three content.');
  });

  it('keeps a line that is not confidently a repeated artifact', () => {
    const pages = [
      page(1, 'Unique first-page note.\nBody one.'),
      page(2, 'Body two.'),
      page(3, 'Body three.'),
    ];

    const result = normalizeExtractedPages(pages);

    expect(result[0]?.text).toContain('Unique first-page note.');
  });

  it('drops empty pages entirely, keeping the rest correctly page-numbered', () => {
    const result = normalizeExtractedPages([page(1, 'Only page with content.'), page(2, '')]);

    expect(result).toEqual([{ pageNumber: 1, text: 'Only page with content.' }]);
  });
});
