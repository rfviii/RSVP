import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReaderPage } from '@/pages/ReaderPage';
import {
  findDocumentById,
  touchLastOpened,
  type StoredDocument,
} from '@/services/storage/documentsRepository';
import { loadProgress } from '@/services/storage/progressRepository';
import { settingsStore } from '@/state/settings/settingsStore';

type RouteStatus = 'loading' | 'not-found' | 'error' | 'ready';

interface ReadyData {
  stored: StoredDocument;
  initialIndex: number;
}

function MessageScreen({
  title,
  message,
  showBackLink,
}: {
  title: string;
  message: string;
  showBackLink?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {showBackLink ? (
        <Link
          to="/"
          className="min-h-[44px] rounded-full bg-sky-700 px-5 py-2 text-sm font-medium leading-[28px] text-white transition hover:bg-sky-600"
        >
          Back to import
        </Link>
      ) : null}
    </div>
  );
}

export function ReaderRoute() {
  const { documentId } = useParams<{ documentId: string }>();
  const [status, setStatus] = useState<RouteStatus>('loading');
  const [data, setData] = useState<ReadyData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);

    async function load() {
      if (!documentId) {
        if (!cancelled) {
          setStatus('not-found');
        }
        return;
      }

      try {
        const [stored, progress] = await Promise.all([
          findDocumentById(documentId),
          loadProgress(documentId),
          settingsStore.whenReady(),
        ]);

        if (cancelled) {
          return;
        }

        if (!stored) {
          setStatus('not-found');
          return;
        }

        setData({ stored, initialIndex: progress?.currentTokenIndex ?? 0 });
        setStatus('ready');
        // Best-effort: don't block or fail the read if this write doesn't land.
        touchLastOpened(documentId).catch(() => {});
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (status === 'loading') {
    return <MessageScreen title="Loading" message="Preparing your document…" />;
  }

  if (status === 'error') {
    return (
      <MessageScreen
        title="Something went wrong"
        message="This document could not be loaded from local storage."
        showBackLink
      />
    );
  }

  if (status === 'not-found' || !data) {
    return (
      <MessageScreen
        title="Document not found"
        message="This document isn't available. It may have been removed, or the link is invalid."
        showBackLink
      />
    );
  }

  return (
    <ReaderPage
      key={data.stored.record.id}
      title={data.stored.record.name}
      textDocument={data.stored.textDocument}
      documentId={data.stored.record.id}
      totalPages={data.stored.record.pageCount}
      initialIndex={data.initialIndex}
    />
  );
}
