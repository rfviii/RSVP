import { describe, expect, it } from 'vitest';
import { calculatePageProgress } from '@/domain/reader/pageProgress';

describe('calculatePageProgress', () => {
  it('reports zero progress when the document has no pages', () => {
    expect(
      calculatePageProgress({ currentPageNumber: 1, totalPages: 0, currentTokenIndex: 0, totalTokens: 0 }),
    ).toEqual({ currentPage: 0, totalPages: 0, ratio: 0 });
  });

  it('uses the exact current page number when known', () => {
    const progress = calculatePageProgress({
      currentPageNumber: 12,
      totalPages: 384,
      currentTokenIndex: 5000,
      totalTokens: 400000,
    });

    expect(progress.currentPage).toBe(12);
    expect(progress.totalPages).toBe(384);
    expect(progress.ratio).toBeCloseTo(12 / 384);
  });

  it('clamps an out-of-range page number into the valid range', () => {
    expect(
      calculatePageProgress({ currentPageNumber: 0, totalPages: 10, currentTokenIndex: 0, totalTokens: 100 })
        .currentPage,
    ).toBe(1);
    expect(
      calculatePageProgress({
        currentPageNumber: 999,
        totalPages: 10,
        currentTokenIndex: 0,
        totalTokens: 100,
      }).currentPage,
    ).toBe(10);
  });

  it('estimates the page proportionally from token position for a legacy document with no page number', () => {
    const progress = calculatePageProgress({
      currentPageNumber: undefined,
      totalPages: 100,
      currentTokenIndex: 24,
      totalTokens: 100,
    });

    // (24 + 1) / 100 tokens through -> ~25% of the way -> page 25 of 100.
    expect(progress.currentPage).toBe(25);
  });

  it('falls back to page 1 when there is no page number and no tokens to estimate from', () => {
    const progress = calculatePageProgress({
      currentPageNumber: undefined,
      totalPages: 50,
      currentTokenIndex: 0,
      totalTokens: 0,
    });

    expect(progress.currentPage).toBe(1);
  });
});
