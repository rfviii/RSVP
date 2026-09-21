import type { ReaderProgress, ReaderState } from '@/domain/reader/types';

export function calculateProgress(state: Pick<ReaderState, 'currentTokenIndex' | 'totalTokens'>): ReaderProgress {
  const { currentTokenIndex, totalTokens } = state;

  if (totalTokens <= 0) {
    return { currentTokenIndex: 0, totalTokens: 0, ratio: 0 };
  }

  const clampedIndex = Math.min(Math.max(currentTokenIndex, 0), totalTokens - 1);

  return {
    currentTokenIndex: clampedIndex,
    totalTokens,
    ratio: (clampedIndex + 1) / totalTokens,
  };
}
