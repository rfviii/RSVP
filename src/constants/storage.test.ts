import { describe, expect, it } from 'vitest';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  PROGRESS_SAVE_INTERVAL_MS,
  SETTINGS_RECORD_ID,
  STORAGE_TABLES,
} from '@/constants/storage';

describe('storage constants', () => {
  it('names the database', () => {
    expect(DATABASE_NAME.length).toBeGreaterThan(0);
  });

  it('starts schema versioning at 1', () => {
    expect(DATABASE_VERSION).toBe(1);
  });

  it('defines the documents, progress, and settings tables', () => {
    expect(STORAGE_TABLES).toEqual({
      documents: 'documents',
      progress: 'progress',
      settings: 'settings',
    });
  });

  it('defines a fixed settings record id', () => {
    expect(SETTINGS_RECORD_ID.length).toBeGreaterThan(0);
  });

  it('defines a positive progress save interval', () => {
    expect(PROGRESS_SAVE_INTERVAL_MS).toBeGreaterThan(0);
  });
});
