import { Link } from 'react-router-dom';
import type { DocumentRecord } from '@/domain/documents/types';
import { formatDate } from '@/utils/formatting/date';

export interface DocumentListItemProps {
  document: DocumentRecord;
  onDelete: (documentId: string) => void;
}

export function DocumentListItem({ document, onDelete }: DocumentListItemProps) {
  return (
    <li className="flex items-center gap-2 rounded-xl bg-slate-100 pr-2 dark:bg-slate-800">
      <Link
        to={`/reader/${document.id}`}
        className="min-w-0 flex-1 rounded-xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{document.name}</p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-400">
          {document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'} · Updated{' '}
          {formatDate(document.updatedAt)}
        </p>
      </Link>
      <button
        type="button"
        onClick={() => onDelete(document.id)}
        aria-label={`Delete ${document.name}`}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-sm font-medium text-red-600 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Delete
      </button>
    </li>
  );
}
