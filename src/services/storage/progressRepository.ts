import { db, type ProgressRow } from '@/services/storage/db';
import { StorageError } from '@/services/storage/errors';

export type ReadingProgress = ProgressRow;

function isValidProgressRow(row: unknown): row is ProgressRow {
  if (typeof row !== 'object' || row === null) {
    return false;
  }
  const candidate = row as Partial<ProgressRow>;
  const hasValidPageNumber =
    candidate.currentPageNumber === undefined ||
    (typeof candidate.currentPageNumber === 'number' && candidate.currentPageNumber >= 1);

  return (
    typeof candidate.documentId === 'string' &&
    typeof candidate.currentTokenIndex === 'number' &&
    Number.isFinite(candidate.currentTokenIndex) &&
    candidate.currentTokenIndex >= 0 &&
    hasValidPageNumber &&
    typeof candidate.updatedAt === 'number'
  );
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  try {
    await db.progress.put(progress);
  } catch (error) {
    throw new StorageError('write-failed', 'Reading progress could not be saved.', { cause: error });
  }
}

/** Returns `undefined` when there is no saved progress, or the record is corrupted. */
export async function loadProgress(documentId: string): Promise<ReadingProgress | undefined> {
  let row: ProgressRow | undefined;
  try {
    row = await db.progress.get(documentId);
  } catch (error) {
    throw new StorageError('read-failed', 'Reading progress could not be loaded.', { cause: error });
  }

  if (!row || !isValidProgressRow(row)) {
    return undefined;
  }

  return row;
}

/** Loads progress for every document at once, for the library list's per-card progress display. */
export async function listAllProgress(): Promise<ReadingProgress[]> {
  let rows: ProgressRow[];
  try {
    rows = await db.progress.toArray();
  } catch (error) {
    throw new StorageError('read-failed', 'Reading progress could not be loaded.', { cause: error });
  }

  return rows.filter(isValidProgressRow);
}
