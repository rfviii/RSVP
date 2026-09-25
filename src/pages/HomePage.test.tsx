import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { db } from '@/services/storage/db';
import { saveDocument } from '@/services/storage/documentsRepository';
import { saveProgress } from '@/services/storage/progressRepository';
import { loadFixtureFile } from '@/tests/helpers/loadFixtureFile';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

beforeEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
});

afterEach(async () => {
  await db.documents.clear();
  await db.progress.clear();
  vi.restoreAllMocks();
});

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reader/:documentId" element={<div>Reader route reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('shows the empty state with a clear import action once the (empty) library has loaded', async () => {
    renderHomePage();

    expect(screen.getByRole('heading', { name: /rsvp reader/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/import pdf/i)).toBeInTheDocument();

    expect(await screen.findByText(/import a pdf to start reading/i)).toBeInTheDocument();
  });

  it('lists previously imported documents, most recently updated first', async () => {
    await saveDocument({
      record: {
        id: 'older',
        name: 'Older.pdf',
        type: 'pdf',
        pageCount: 3,
        tokenCount: 10,
        createdAt: 100,
        updatedAt: 100,
      },
      textDocument: sampleTextDocument,
    });
    await saveDocument({
      record: {
        id: 'newer',
        name: 'Newer.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 8,
        createdAt: 200,
        updatedAt: 200,
      },
      textDocument: sampleTextDocument,
    });

    renderHomePage();

    const items = await screen.findAllByRole('link', { name: /\.pdf/i });
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Newer.pdf'),
      expect.stringContaining('Older.pdf'),
    ]);
  });

  it('opens a document from the list', async () => {
    await saveDocument({
      record: {
        id: 'doc-1',
        name: 'My Document.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 8,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: sampleTextDocument,
    });

    renderHomePage();

    fireEvent.click(await screen.findByRole('link', { name: /my document\.pdf/i }));

    await waitFor(() => {
      expect(screen.getByText('Reader route reached')).toBeInTheDocument();
    });
  });

  it('deletes a document after confirming', async () => {
    await saveDocument({
      record: {
        id: 'doc-1',
        name: 'Doomed.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 8,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: sampleTextDocument,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderHomePage();

    fireEvent.click(await screen.findByRole('button', { name: /delete doomed\.pdf/i }));

    await waitFor(() => {
      expect(screen.queryByText('Doomed.pdf')).not.toBeInTheDocument();
    });
    expect(await db.documents.get('doc-1')).toBeUndefined();
  });

  it('keeps a document when the delete confirmation is declined', async () => {
    await saveDocument({
      record: {
        id: 'doc-1',
        name: 'Safe.pdf',
        type: 'pdf',
        pageCount: 1,
        tokenCount: 8,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: sampleTextDocument,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderHomePage();

    fireEvent.click(await screen.findByRole('button', { name: /delete safe\.pdf/i }));

    expect(screen.getByText('Safe.pdf')).toBeInTheDocument();
    expect(await db.documents.get('doc-1')).not.toBeUndefined();
  });

  it('imports a real PDF and navigates to its reader route', async () => {
    renderHomePage();

    const file = loadFixtureFile('sample.pdf', 'application/pdf');
    fireEvent.change(screen.getByLabelText(/import pdf/i), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Reader route reached')).toBeInTheDocument();
    });
  });

  it('shows an error state when the selected file is not a PDF', async () => {
    renderHomePage();

    const file = loadFixtureFile('not-a-pdf.txt', 'text/plain');
    fireEvent.change(screen.getByLabelText(/import pdf/i), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/does not appear to be a pdf/i);
  });

  it('shows an error state when the PDF is corrupted', async () => {
    renderHomePage();

    const file = loadFixtureFile('corrupted.pdf', 'application/pdf');
    fireEvent.change(screen.getByLabelText(/import pdf/i), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be opened/i);
  });

  it('shows an error state when the PDF has extractable text but no readable words', async () => {
    renderHomePage();

    const file = loadFixtureFile('symbols-only.pdf', 'application/pdf');
    fireEvent.change(screen.getByLabelText(/import pdf/i), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn.t contain any readable words/i);
  });

  it('shows a page-based progress summary and a cover placeholder on each card', async () => {
    await saveDocument({
      record: {
        id: 'doc-1',
        name: 'Progressed.pdf',
        type: 'pdf',
        pageCount: 300,
        tokenCount: 100,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: sampleTextDocument,
    });
    await saveProgress({ documentId: 'doc-1', currentTokenIndex: 30, currentPageNumber: 90, updatedAt: 0 });

    renderHomePage();

    expect(await screen.findByText('Page 90 / 300')).toBeInTheDocument();
    // No PDF renderer is available in this test environment, so the cover
    // always falls back to the placeholder here — this locks in that the
    // fallback renders instead of a broken image.
    expect(screen.getByText('No cover')).toBeInTheDocument();
  });

  it('shows page 1 of the total for a document that has never been opened', async () => {
    await saveDocument({
      record: {
        id: 'doc-1',
        name: 'Fresh.pdf',
        type: 'pdf',
        pageCount: 12,
        tokenCount: 100,
        createdAt: 0,
        updatedAt: 0,
      },
      textDocument: sampleTextDocument,
    });

    renderHomePage();

    expect(await screen.findByText('Page 1 / 12')).toBeInTheDocument();
  });

  it('renders a pre-Phase-21 legacy document (no page numbers, no cover, no lastOpenedAt) without crashing', async () => {
    // Simulates a row already sitting in a real user's IndexedDB from before
    // page-aware tokenization, thumbnails, and lastOpenedAt existed — written
    // directly rather than through saveDocument(), which would otherwise
    // always produce a current-shaped record.
    await db.documents.put({
      id: 'legacy-doc',
      name: 'Old Import.pdf',
      type: 'pdf',
      pageCount: 50,
      tokenCount: 4,
      createdAt: 12345,
      updatedAt: 12345,
      // lastOpenedAt and coverThumbnail intentionally absent.
      textDocument: {
        paragraphs: [
          {
            id: 'paragraph-0',
            // pageNumber intentionally absent, matching pre-Phase-21 storage.
            sentences: [
              {
                id: 'sentence-0',
                tokens: [
                  { id: 'token-0', text: 'Old', index: 0, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
                  { id: 'token-1', text: 'text', index: 1, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
                ],
              },
            ],
          },
        ],
      },
    } as never);
    // Legacy progress row: no currentPageNumber, matching pre-Phase-22 storage.
    await db.progress.put({ documentId: 'legacy-doc', currentTokenIndex: 1, updatedAt: 12345 } as never);

    renderHomePage();

    expect(await screen.findByText('Old Import.pdf')).toBeInTheDocument();
    expect(screen.getByText('No cover')).toBeInTheDocument();
    // Falls back to a proportional page estimate rather than crashing or showing "page undefined".
    expect(screen.getByText(/^Page \d+ \/ 50$/)).toBeInTheDocument();
    expect(screen.getByText(/^Opened /)).toBeInTheDocument();
  });
});
