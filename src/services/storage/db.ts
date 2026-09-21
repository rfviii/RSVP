import Dexie, { type EntityTable } from 'dexie';
import { DATABASE_NAME, DATABASE_VERSION, STORAGE_TABLES } from '@/constants/storage';
import type { DocumentRecord } from '@/domain/documents/types';
import type { TextDocument } from '@/domain/text/types';
import type { AppSettings } from '@/types/settings';

export interface DocumentRow extends DocumentRecord {
  textDocument: TextDocument;
}

export interface ProgressRow {
  documentId: string;
  currentTokenIndex: number;
  updatedAt: number;
}

export interface SettingsRow extends AppSettings {
  id: string;
}

/**
 * The app's IndexedDB database. Schema is versioned per Dexie's
 * `.version(N).stores(...)` convention: a future breaking schema change
 * adds a new `.version()` call (with an `.upgrade()` migration if needed)
 * rather than editing this one in place.
 */
class RsvpDatabase extends Dexie {
  documents!: EntityTable<DocumentRow, 'id'>;
  progress!: EntityTable<ProgressRow, 'documentId'>;
  settings!: EntityTable<SettingsRow, 'id'>;

  constructor() {
    super(DATABASE_NAME);

    this.version(DATABASE_VERSION).stores({
      [STORAGE_TABLES.documents]: 'id, createdAt, updatedAt',
      [STORAGE_TABLES.progress]: 'documentId, updatedAt',
      [STORAGE_TABLES.settings]: 'id',
    });
  }
}

export const db = new RsvpDatabase();
