import { render, screen, waitFor } from '@testing-library/react';
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
      pageNumber: 1,
      sentences: [
        {
          id: 's0',
          tokens: [
            {
              id: 't0',
              text: 'Hello',
              index: 0,
              sentenceIndex: 0,
              paragraphIndex: 0,
              pageNumber: 1,
              trailingText: '',
              punctuation: 'none',
            },
            {
              id: 't1',
              text: 'World',
              index: 1,
              sentenceIndex: 0,
              paragraphIndex: 0,
              pageNumber: 1,
              trailingText: '.',
              punctuation: 'paragraphEnd',
            },
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

  it('records lastOpenedAt when a document is successfully loaded', async () => {
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

    await waitFor(async () => {
      const row = await db.documents.get('doc-exists');
      expect(row?.lastOpenedAt).toBeGreaterThan(0);
    });
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

    expect(await screen.findByTestId('current-token')).toHaveTextContent('World');
  });

  it('opens and resumes a pre-Phase-21 legacy document (tokens with no pageNumber/trailingText) without crashing', async () => {
    // Written directly to IndexedDB, bypassing saveDocument(), to simulate a
    // row already stored by a version of the app that predates page-aware
    // tokenization — real tokens in a real user's database won't have these
    // fields even though the current Token type says they're required.
    await db.documents.put({
      id: 'legacy-doc',
      name: 'Legacy.pdf',
      type: 'pdf',
      pageCount: 10,
      tokenCount: 2,
      createdAt: 0,
      updatedAt: 0,
      textDocument: {
        paragraphs: [
          {
            id: 'paragraph-0',
            sentences: [
              {
                id: 'sentence-0',
                tokens: [
                  { id: 'token-0', text: 'Legacy', index: 0, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
                  {
                    id: 'token-1',
                    text: 'text',
                    index: 1,
                    sentenceIndex: 0,
                    paragraphIndex: 0,
                    punctuation: 'paragraphEnd',
                  },
                ],
              },
            ],
          },
        ],
      },
    } as never);
    await db.progress.put({ documentId: 'legacy-doc', currentTokenIndex: 1, updatedAt: 0 } as never);

    renderAt('/reader/legacy-doc');

    expect(await screen.findByTestId('current-token')).toHaveTextContent('text');
    // Falls back to a proportional page estimate instead of crashing on the missing page number.
    expect(screen.getByText(/^Page \d+ \/ 10$/)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown document id', async () => {
    renderAt('/reader/does-not-exist');

    expect(await screen.findByRole('heading', { name: /document not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to import/i })).toBeInTheDocument();
  });
});
