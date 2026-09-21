import { describe, expect, it } from 'vitest';
import { formatDate } from '@/utils/formatting/date';

describe('formatDate', () => {
  it('formats a timestamp as a short, human-readable date', () => {
    expect(formatDate(Date.UTC(2026, 0, 5, 12))).toBe('Jan 5, 2026');
  });

  it('formats a different month and day correctly', () => {
    expect(formatDate(Date.UTC(2025, 11, 31, 12))).toBe('Dec 31, 2025');
  });
});
