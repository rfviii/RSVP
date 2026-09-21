export const DOCUMENT_TYPES = ['pdf'] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentRecord {
  id: string;
  name: string;
  type: DocumentType;
  pageCount: number;
  tokenCount: number;
  createdAt: number;
  updatedAt: number;
}
