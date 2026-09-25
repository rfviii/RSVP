import { Link } from 'react-router-dom';
import type { DocumentRecord } from '@/domain/documents/types';
import type { PageProgress } from '@/domain/reader/types';
import { useObjectUrl } from '@/hooks/documents/useObjectUrl';
import { formatDate } from '@/utils/formatting/date';

export interface DocumentListItemProps {
  document: DocumentRecord;
  progress: PageProgress;
  onDelete: (documentId: string) => void;
}

export function DocumentListItem({ document, progress, onDelete }: DocumentListItemProps) {
  const coverUrl = useObjectUrl(document.coverThumbnail);
  const percent = Math.round(progress.ratio * 100);
  const lastOpened = document.lastOpenedAt ?? document.createdAt;

  return (
    <li className="flex flex-col overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
      <Link
        to={`/reader/${document.id}`}
        className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              No cover
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {document.name}
          </p>

          <div className="mt-auto flex flex-col gap-1 pt-2">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-slate-300 dark:bg-slate-600"
              role="progressbar"
              aria-label={`Reading progress for ${document.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className="h-full bg-sky-600 dark:bg-sky-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {progress.totalPages > 0
                ? `Page ${progress.currentPage} / ${progress.totalPages}`
                : `${document.pageCount} ${document.pageCount === 1 ? 'page' : 'pages'}`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Opened {formatDate(lastOpened)}</p>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => onDelete(document.id)}
        aria-label={`Delete ${document.name}`}
        className="min-h-[44px] border-t border-slate-200 text-sm font-medium text-red-600 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Delete
      </button>
    </li>
  );
}
