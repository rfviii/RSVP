import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DocumentList } from '@/components/documents/DocumentList';
import type { DocumentRecord } from '@/domain/documents/types';
import { calculatePageProgress } from '@/domain/reader/pageProgress';
import type { PageProgress } from '@/domain/reader/types';
import { flattenTextDocumentTokens } from '@/domain/rsvp';
import { processExtractedPages } from '@/domain/text/pipeline';
import { PdfProcessingError } from '@/services/pdf/errors';
import { deleteDocument, listDocuments, saveDocument } from '@/services/storage/documentsRepository';
import { StorageError } from '@/services/storage/errors';
import { listAllProgress } from '@/services/storage/progressRepository';

type LibraryStatus = 'loading' | 'ready' | 'error';

const GENERIC_ERROR_MESSAGE = 'Something went wrong while processing this document.';

export function HomePage() {
  const navigate = useNavigate();
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>('loading');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [progressByDocumentId, setProgressByDocumentId] = useState<Map<string, PageProgress>>(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    setLibraryStatus('loading');
    try {
      const [records, progressRows] = await Promise.all([listDocuments(), listAllProgress()]);
      const progressRowsByDocumentId = new Map(progressRows.map((row) => [row.documentId, row]));

      setDocuments(records);
      setProgressByDocumentId(
        new Map(
          records.map((record) => {
            const progressRow = progressRowsByDocumentId.get(record.id);
            return [
              record.id,
              calculatePageProgress({
                currentPageNumber: progressRow?.currentPageNumber,
                totalPages: record.pageCount,
                currentTokenIndex: progressRow?.currentTokenIndex ?? 0,
                totalTokens: record.tokenCount,
              }),
            ];
          }),
        ),
      );
      setLibraryStatus('ready');
    } catch {
      setLibraryStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  async function handleFileSelected(file: File) {
    setIsImporting(true);
    setActionError(null);

    try {
      const { importPdfFile } = await import('@/services/pdf/importPdf');
      const extraction = await importPdfFile(file);
      const textDocument = processExtractedPages(extraction.pages);
      const tokenCount = flattenTextDocumentTokens(textDocument).length;

      if (tokenCount === 0) {
        throw new PdfProcessingError(
          'no-readable-words',
          'This document doesn’t contain any readable words. It may consist only of images, symbols, or unsupported characters.',
        );
      }

      const now = Date.now();

      const record: DocumentRecord = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'pdf',
        pageCount: extraction.pageCount,
        tokenCount,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        coverThumbnail: extraction.coverThumbnail,
      };

      await saveDocument({ record, textDocument });
      navigate(`/reader/${record.id}`);
    } catch (error) {
      setIsImporting(false);
      setActionError(
        error instanceof PdfProcessingError || error instanceof StorageError
          ? error.message
          : GENERIC_ERROR_MESSAGE,
      );
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      void handleFileSelected(file);
    }
  }

  async function handleDelete(documentId: string) {
    const target = documents.find((document) => document.id === documentId);
    const confirmed = window.confirm(
      `Delete "${target?.name ?? 'this document'}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(documentId);
      setDocuments((previous) => previous.filter((document) => document.id !== documentId));
    } catch {
      setActionError('This document could not be deleted.');
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">RSVP Reader</h1>
          <Link
            to="/settings"
            className="flex min-h-[44px] items-center text-sm font-medium text-slate-600 hover:underline dark:text-slate-400"
          >
            Settings
          </Link>
        </div>

        {libraryStatus === 'loading' ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading your documents…</p>
        ) : null}

        {libraryStatus === 'error' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Your documents could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => void loadLibrary()}
              className="min-h-[44px] rounded-full bg-slate-100 px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        ) : null}

        {libraryStatus === 'ready' && documents.length === 0 ? (
          <p className="max-w-sm text-center text-sm text-slate-600 dark:text-slate-400">
            Import a PDF to start reading. Everything is processed on this device.
          </p>
        ) : null}

        {libraryStatus === 'ready' && documents.length > 0 ? (
          <DocumentList
            documents={documents}
            progressByDocumentId={progressByDocumentId}
            onDelete={handleDelete}
          />
        ) : null}

        <label
          className={`min-h-[44px] cursor-pointer rounded-full bg-sky-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-sky-600 ${
            isImporting ? 'pointer-events-none opacity-70' : ''
          }`}
        >
          {isImporting ? 'Processing…' : 'Import PDF'}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={handleInputChange}
            disabled={isImporting}
            aria-label="Import PDF"
          />
        </label>

        {actionError ? (
          <p role="alert" className="max-w-sm text-center text-sm text-red-600 dark:text-red-400">
            {actionError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
