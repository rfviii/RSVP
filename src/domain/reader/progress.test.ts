import { describe, expect, it } from 'vitest';
import { calculateProgress } from '@/domain/reader/progress';

describe('calculateProgress', () => {
  it('reports zero progress when there are no tokens', () => {
    expect(calculateProgress({ currentTokenIndex: 0, totalTokens: 0 })).toEqual({
      currentTokenIndex: 0,
      totalTokens: 0,
      ratio: 0,
    });
  });

  it('reports partial progress mid-document', () => {
    const progress = calculateProgress({ currentTokenIndex: 24, totalTokens: 100 });

    expect(progress.ratio).toBeCloseTo(0.25);
    expect(progress.currentTokenIndex).toBe(24);
    expect(progress.totalTokens).toBe(100);
  });

  it('reports complete progress on the final token', () => {
    const progress = calculateProgress({ currentTokenIndex: 99, totalTokens: 100 });

    expect(progress.ratio).toBe(1);
  });

  it('clamps an out-of-range index instead of producing an invalid ratio', () => {
    expect(calculateProgress({ currentTokenIndex: -5, totalTokens: 10 }).currentTokenIndex).toBe(0);
    expect(calculateProgress({ currentTokenIndex: 999, totalTokens: 10 }).currentTokenIndex).toBe(9);
  });
});
