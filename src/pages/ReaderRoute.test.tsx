import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReaderRoute } from '@/pages/ReaderRoute';
import { db } from '@/services/storage/db';
import { saveDocument } from '@/services/storage/documentsRepository';
import { saveProgress } from '@/services/storage/progressRepository';
import type { TextDocument } from '@/domain/text/types';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reader/:documentId" element={<ReaderRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

const SAMPLE_DOCUMENT: TextDocument = {
  paragraphs: [
    {
      id: 'p0',
      sentences: [
        {
          id: 's0',
          tokens: [
            { id: 't0', text: 'Hello', index: 0, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
            { id: 't1', text: 'World', index: 1, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'paragraphEnd' },
          ],
        },
      ],
    },
  ],
};

beforeEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
});

afterEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
});

describe('ReaderRoute', () => {
  it('shows a loading state while the document is being fetched', () => {
    renderAt('/reader/doc-exists');

    expect(screen.getByRole('heading', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders the reader for a document that exists in the store', async () => {
    await saveDocument({
      record: {
        id: 'doc-exists',
        name: 'My Document.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 2,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: SAMPLE_DOCUMENT,
    });

    renderAt('/reader/doc-exists');

    expect(await screen.findByRole('heading', { name: 'My Document.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('resumes from previously saved reading progress', async () => {
    await saveDocument({
      record: {
        id: 'doc-with-progress',
        name: 'Resumable.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 2,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: SAMPLE_DOCUMENT,
    });
    await saveProgress({ documentId: 'doc-with-progress', currentTokenIndex: 1, updatedAt: 0 });

    renderAt('/reader/doc-with-progress');

    expect(await screen.findByText('World')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown document id', async () => {
    renderAt('/reader/does-not-exist');

    expect(await screen.findByRole('heading', { name: /document not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to import/i })).toBeInTheDocument();
  });
});
