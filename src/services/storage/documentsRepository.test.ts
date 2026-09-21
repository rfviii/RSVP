import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/services/storage/db';
import {
  deleteDocument,
  findDocumentById,
  listDocuments,
  saveDocument,
  type StoredDocument,
} from '@/services/storage/documentsRepository';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

function makeEntry(id: string, updatedAt = 0): StoredDocument {
  return {
    record: {
      id,
      name: `${id}.pdf`,
      type: 'pdf',
      pageCount: 1,
      tokenCount: 8,
      createdAt: updatedAt,
      updatedAt,
    },
    textDocument: sampleTextDocument,
  };
}

beforeEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
});

afterEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
});

describe('findDocumentById', () => {
  it('returns undefined for an id that was never saved', async () => {
    expect(await findDocumentById('does-not-exist')).toBeUndefined();
  });

  it('returns the saved document by id', async () => {
    await saveDocument(makeEntry('doc-1'));

    const found = await findDocumentById('doc-1');
    expect(found?.record.name).toBe('doc-1.pdf');
    expect(found?.textDocument).toEqual(sampleTextDocument);
  });

  it('treats a corrupted record as missing rather than throwing', async () => {
    await db.documents.put({ id: 'broken', name: 'broken.pdf' } as never);

    expect(await findDocumentById('broken')).toBeUndefined();
  });
});

describe('saveDocument', () => {
  it('overwrites a previous save for the same id', async () => {
    await saveDocument(makeEntry('doc-2'));
    const updated = makeEntry('doc-2');
    updated.record.name = 'renamed.pdf';
    await saveDocument(updated);

    expect((await findDocumentById('doc-2'))?.record.name).toBe('renamed.pdf');
  });
});

describe('listDocuments', () => {
  it('returns saved documents most-recently-updated first', async () => {
    await saveDocument(makeEntry('older', 100));
    await saveDocument(makeEntry('newer', 200));

    const records = await listDocuments();

    expect(records.map((record) => record.id)).toEqual(['newer', 'older']);
  });

  it('returns an empty list when nothing has been saved', async () => {
    expect(await listDocuments()).toEqual([]);
  });
});

describe('deleteDocument', () => {
  it('removes the document and its reading progress together', async () => {
    await saveDocument(makeEntry('doc-3'));
    await db.progress.put({ documentId: 'doc-3', currentTokenIndex: 2, updatedAt: 0 });

    await deleteDocument('doc-3');

    expect(await findDocumentById('doc-3')).toBeUndefined();
    expect(await db.progress.get('doc-3')).toBeUndefined();
  });
});
