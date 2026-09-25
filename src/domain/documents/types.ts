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
  /** When the reader last opened this document. Absent for documents imported before this existed. */
  lastOpenedAt?: number;
  /** A small rendered preview of the PDF's first page, for the library card. Best-effort — may be absent. */
  coverThumbnail?: Blob;
}
