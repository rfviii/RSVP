import { DocumentListItem } from '@/components/documents/DocumentListItem';
import type { DocumentRecord } from '@/domain/documents/types';

export interface DocumentListProps {
  documents: DocumentRecord[];
  onDelete: (documentId: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  return (
    <ul className="flex w-full flex-col gap-2">
      {documents.map((document) => (
        <DocumentListItem key={document.id} document={document} onDelete={onDelete} />
      ))}
    </ul>
  );
}
