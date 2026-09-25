import { memo } from 'react';
import type { PageProgress } from '@/domain/reader/types';

export interface ProgressIndicatorProps {
  progress: PageProgress;
}

export const ProgressIndicator = memo(function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const percent = Math.round(progress.ratio * 100);

  return (
    <div
      className="flex w-28 shrink-0 flex-col gap-1 sm:w-48"
      role="group"
      aria-label="Reading progress"
    >
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full bg-sky-600 transition-[width] dark:bg-sky-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="flex items-baseline justify-end gap-1 text-xs text-slate-600 dark:text-slate-400">
        <span>{progress.totalPages > 0 ? `Page ${progress.currentPage} / ${progress.totalPages}` : '—'}</span>
        <span aria-hidden="true">·</span>
        <span>{percent}%</span>
      </span>
    </div>
  );
});
