import { useEffect, useRef } from 'react';
import { PROGRESS_SAVE_INTERVAL_MS } from '@/constants/storage';
import { saveProgress } from '@/services/storage/progressRepository';
import { throttle } from '@/utils/throttle';

/**
 * Persists reading progress. While actively playing, saves are throttled to
 * at most once per `PROGRESS_SAVE_INTERVAL_MS` (ticks can happen several
 * times a second). Discrete, infrequent actions (manual next/previous,
 * restart, or pausing) save immediately instead of waiting out the
 * throttle: those transitions are also exactly when a user is most likely
 * to close the tab or reload right after, and an async IndexedDB write
 * queued for "later" during page teardown is not reliably given the chance
 * to finish (browsers don't guarantee pending unload-time async work
 * completes) — so the fix is to not leave it pending in the first place.
 */
export function useProgressPersistence(
  documentId: string | null,
  currentTokenIndex: number,
  totalTokens: number,
  isPlaying: boolean,
  currentPageNumber: number | undefined,
): void {
  const throttledSaveRef = useRef(
    throttle((documentIdToSave: string, indexToSave: number, pageToSave: number | undefined) => {
      // Best-effort: a failed save shouldn't crash the reader or surface
      // as an unhandled rejection, just leave progress un-persisted.
      saveProgress({
        documentId: documentIdToSave,
        currentTokenIndex: indexToSave,
        currentPageNumber: pageToSave,
        updatedAt: Date.now(),
      }).catch(() => {});
    }, PROGRESS_SAVE_INTERVAL_MS),
  );

  useEffect(() => {
    if (!documentId || totalTokens === 0) {
      return;
    }
    if (isPlaying) {
      throttledSaveRef.current(documentId, currentTokenIndex, currentPageNumber);
    } else {
      throttledSaveRef.current.cancel();
      saveProgress({ documentId, currentTokenIndex, currentPageNumber, updatedAt: Date.now() }).catch(
        () => {},
      );
    }
  }, [documentId, currentTokenIndex, totalTokens, isPlaying, currentPageNumber]);

  useEffect(() => {
    const throttledSave = throttledSaveRef.current;

    function flushIfHidden() {
      if (document.visibilityState === 'hidden') {
        throttledSave.flush();
      }
    }

    document.addEventListener('visibilitychange', flushIfHidden);
    window.addEventListener('pagehide', throttledSave.flush);

    return () => {
      document.removeEventListener('visibilitychange', flushIfHidden);
      window.removeEventListener('pagehide', throttledSave.flush);
      throttledSave.flush();
    };
  }, []);
}
