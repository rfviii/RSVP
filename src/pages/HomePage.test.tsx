import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { db } from '@/services/storage/db';
import { saveDocument } from '@/services/storage/documentsRepository';
import { loadFixtureFile } from '@/tests/helpers/loadFixtureFile';
import { sampleTextDocument } from '@/tests/fixtures/sampleTextDocument';

beforeEach(async () => {
  await db.documents.clear();
});

afterEach(async () => {
  await db.documents.clear();
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
});
