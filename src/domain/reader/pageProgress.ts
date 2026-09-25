import type { PageProgress } from '@/domain/reader/types';

export interface CalculatePageProgressParams {
  /**
   * The current token's page number, when known. `undefined` for a
   * document imported before tokens carried page metadata (a "legacy"
   * document) — there is no PDF to re-extract page numbers from, so the
   * page is estimated instead of left blank.
   */
  currentPageNumber: number | undefined;
  totalPages: number;
  currentTokenIndex: number;
  totalTokens: number;
}

/**
 * Derives page-based progress for display. When the current token's real
 * page number is known this is exact; otherwise it falls back to a
 * proportional estimate from the token position, so legacy documents still
 * show a reasonable (if approximate) page number instead of no page at all.
 */
export function calculatePageProgress(params: CalculatePageProgressParams): PageProgress {
  const { currentPageNumber, totalPages, currentTokenIndex, totalTokens } = params;

  if (totalPages <= 0) {
    return { currentPage: 0, totalPages: 0, ratio: 0 };
  }

  const resolvedPage =
    currentPageNumber ??
    (totalTokens > 0 ? Math.round(((currentTokenIndex + 1) / totalTokens) * totalPages) : 1);

  const clampedPage = Math.min(Math.max(resolvedPage, 1), totalPages);

  return {
    currentPage: clampedPage,
    totalPages,
    ratio: clampedPage / totalPages,
  };
}
