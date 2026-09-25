import { DocumentListItem } from '@/components/documents/DocumentListItem';
import type { DocumentRecord } from '@/domain/documents/types';
import type { PageProgress } from '@/domain/reader/types';

export interface DocumentListProps {
  documents: DocumentRecord[];
  progressByDocumentId: Map<string, PageProgress>;
  onDelete: (documentId: string) => void;
}

const NO_PROGRESS: PageProgress = { currentPage: 0, totalPages: 0, ratio: 0 };

export function DocumentList({ documents, progressByDocumentId, onDelete }: DocumentListProps) {
  return (
    <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
      {documents.map((document) => (
        <DocumentListItem
          key={document.id}
          document={document}
          progress={progressByDocumentId.get(document.id) ?? NO_PROGRESS}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
