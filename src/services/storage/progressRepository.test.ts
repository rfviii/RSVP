import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/services/storage/db';
import { loadProgress, saveProgress } from '@/services/storage/progressRepository';

beforeEach(async () => {
  await db.progress.clear();
});

afterEach(async () => {
  await db.progress.clear();
});

describe('loadProgress', () => {
  it('returns undefined when nothing has been saved for a document', async () => {
    expect(await loadProgress('doc-1')).toBeUndefined();
  });

  it('returns a previously saved position', async () => {
    await saveProgress({ documentId: 'doc-1', currentTokenIndex: 42, updatedAt: 123 });

    expect(await loadProgress('doc-1')).toEqual({
      documentId: 'doc-1',
      currentTokenIndex: 42,
      updatedAt: 123,
    });
  });

  it('treats a corrupted record as missing rather than throwing', async () => {
    await db.progress.put({ documentId: 'broken', currentTokenIndex: -1, updatedAt: 0 });

    expect(await loadProgress('broken')).toBeUndefined();
  });
});

describe('saveProgress', () => {
  it('overwrites a previous save for the same document', async () => {
    await saveProgress({ documentId: 'doc-2', currentTokenIndex: 5, updatedAt: 1 });
    await saveProgress({ documentId: 'doc-2', currentTokenIndex: 9, updatedAt: 2 });

    expect(await loadProgress('doc-2')).toEqual({
      documentId: 'doc-2',
      currentTokenIndex: 9,
      updatedAt: 2,
    });
  });

  it('keeps progress for different documents independent', async () => {
    await saveProgress({ documentId: 'doc-a', currentTokenIndex: 1, updatedAt: 1 });
    await saveProgress({ documentId: 'doc-b', currentTokenIndex: 2, updatedAt: 1 });

    expect((await loadProgress('doc-a'))?.currentTokenIndex).toBe(1);
    expect((await loadProgress('doc-b'))?.currentTokenIndex).toBe(2);
  });
});
