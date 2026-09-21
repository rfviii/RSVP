export const DATABASE_NAME = 'rsvp-reader';
export const DATABASE_VERSION = 1;

export const STORAGE_TABLES = {
  documents: 'documents',
  progress: 'progress',
  settings: 'settings',
} as const;

export type StorageTable = (typeof STORAGE_TABLES)[keyof typeof STORAGE_TABLES];

/** There is only ever one settings row; this is its fixed primary key. */
export const SETTINGS_RECORD_ID = 'app';

/** Reading progress is saved at most this often while it keeps changing (e.g. during playback). */
export const PROGRESS_SAVE_INTERVAL_MS = 2000;
