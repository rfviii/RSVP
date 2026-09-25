import { isDocumentType } from '@/domain/documents/guards';
import type { DocumentRecord } from '@/domain/documents/types';
import type { TextDocument } from '@/domain/text/types';
import { db, type DocumentRow } from '@/services/storage/db';
import { StorageError } from '@/services/storage/errors';

export interface StoredDocument {
  record: DocumentRecord;
  textDocument: TextDocument;
}

function isValidDocumentRow(row: unknown): row is DocumentRow {
  if (typeof row !== 'object' || row === null) {
    return false;
  }
  const candidate = row as Partial<DocumentRow>;
  const hasValidLastOpenedAt =
    candidate.lastOpenedAt === undefined || typeof candidate.lastOpenedAt === 'number';
  const hasValidCoverThumbnail =
    candidate.coverThumbnail === undefined || candidate.coverThumbnail instanceof Blob;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    isDocumentType(candidate.type) &&
    typeof candidate.pageCount === 'number' &&
    typeof candidate.tokenCount === 'number' &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.updatedAt === 'number' &&
    hasValidLastOpenedAt &&
    hasValidCoverThumbnail &&
    typeof candidate.textDocument === 'object' &&
    candidate.textDocument !== null &&
    Array.isArray(candidate.textDocument.paragraphs)
  );
}

function toStoredDocument(row: DocumentRow): StoredDocument {
  const { textDocument, ...record } = row;
  return { record, textDocument };
}

export async function saveDocument(entry: StoredDocument): Promise<void> {
  try {
    await db.documents.put({ ...entry.record, textDocument: entry.textDocument });
  } catch (error) {
    throw new StorageError('write-failed', 'This document could not be saved.', { cause: error });
  }
}

/** Returns `undefined` for a missing id as well as for a corrupted record, rather than throwing. */
export async function findDocumentById(documentId: string): Promise<StoredDocument | undefined> {
  let row: DocumentRow | undefined;
  try {
    row = await db.documents.get(documentId);
  } catch (error) {
    throw new StorageError('read-failed', 'This document could not be loaded.', { cause: error });
  }

  if (!row || !isValidDocumentRow(row)) {
    return undefined;
  }

  return toStoredDocument(row);
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  let rows: DocumentRow[];
  try {
    rows = await db.documents.orderBy('updatedAt').reverse().toArray();
  } catch (error) {
    throw new StorageError('read-failed', 'The document list could not be loaded.', { cause: error });
  }

  return rows.filter(isValidDocumentRow).map((row) => toStoredDocument(row).record);
}

/**
 * Records that a document was just opened, without rewriting its (possibly
 * large) `textDocument`. Best-effort: a failed write here shouldn't block
 * reading, so the caller is expected to swallow the rejection.
 */
export async function touchLastOpened(documentId: string): Promise<void> {
  try {
    await db.documents.update(documentId, { lastOpenedAt: Date.now() });
  } catch (error) {
    throw new StorageError('write-failed', 'This document could not be updated.', { cause: error });
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    await db.transaction('rw', db.documents, db.progress, async () => {
      await db.documents.delete(documentId);
      await db.progress.delete(documentId);
    });
  } catch (error) {
    throw new StorageError('write-failed', 'This document could not be deleted.', { cause: error });
  }
}
