const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** Formats a timestamp (ms since epoch) as a short, locale-stable date like "Jan 5, 2026". */
export function formatDate(timestampMs: number): string {
  return DATE_FORMATTER.format(new Date(timestampMs));
}
