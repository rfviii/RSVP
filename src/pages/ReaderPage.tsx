import { useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HybridReaderView } from '@/components/reader/HybridReaderView';
import { KeyboardShortcutsLegend } from '@/components/reader/KeyboardShortcutsLegend';
import { PlaybackControls } from '@/components/reader/PlaybackControls';
import { ProgressIndicator } from '@/components/reader/ProgressIndicator';
import { WpmControl } from '@/components/reader/WpmControl';
import { calculatePageProgress } from '@/domain/reader/pageProgress';
import { flattenTextDocumentTokens } from '@/domain/rsvp';
import type { TextDocument } from '@/domain/text/types';
import { useAutoPauseOnHidden } from '@/hooks/reader/useAutoPauseOnHidden';
import { useAutoPauseOnScroll } from '@/hooks/reader/useAutoPauseOnScroll';
import { useFullscreen } from '@/hooks/reader/useFullscreen';
import { useProgressPersistence } from '@/hooks/reader/useProgressPersistence';
import { useReaderKeyboardShortcuts } from '@/hooks/reader/useReaderKeyboardShortcuts';
import { useReaderWindow } from '@/hooks/reader/useReaderWindow';
import { useRsvpEngine } from '@/hooks/reader/useRsvpEngine';
import { useScrollLock } from '@/hooks/reader/useScrollLock';
import { useSettings } from '@/hooks/settings/useSettings';

export interface ReaderPageProps {
  title: string;
  textDocument: TextDocument;
  documentId?: string;
  /** The PDF's total page count, for page-based progress display. */
  totalPages?: number;
  initialWpm?: number;
  initialIndex?: number;
}

export function ReaderPage({
  title,
  textDocument,
  documentId,
  totalPages = 0,
  initialWpm,
  initialIndex,
}: ReaderPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useMemo(() => flattenTextDocumentTokens(textDocument), [textDocument]);
  const { settings, setWpm: setDefaultWpm } = useSettings();

  const { state, currentToken, start, pause, next, previous, restart, setWpm } = useRsvpEngine({
    tokens,
    wpm: initialWpm ?? settings.wpm,
    documentId: documentId ?? null,
    initialIndex,
  });

  const isPlaying = state.playbackState === 'playing';
  const isFocusMode = settings.readingBehavior === 'focus';
  const isFocusModeActive = isFocusMode && isPlaying;

  useProgressPersistence(
    documentId ?? null,
    state.currentTokenIndex,
    state.totalTokens,
    isPlaying,
    currentToken?.pageNumber,
  );
  useAutoPauseOnHidden(isPlaying, pause);
  // The two RSVP Reading Behavior modes are mutually exclusive: Focus Mode
  // locks scrolling (page-level here, document-layer via the prop below
  // passed to HybridReaderView) instead of pausing on it; Normal Mode keeps
  // the document scrollable and optionally pauses on scroll per the
  // "Pause RSVP on scroll" setting.
  useScrollLock(isFocusModeActive);
  useAutoPauseOnScroll(!isFocusMode && isPlaying && settings.pauseOnScroll, pause);

  const { isFullscreen, isSupported: isFullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen(containerRef);

  const visibleParagraphs = useReaderWindow(textDocument, currentToken?.paragraphIndex);

  const progress = useMemo(
    () =>
      calculatePageProgress({
        currentPageNumber: currentToken?.pageNumber,
        totalPages,
        currentTokenIndex: state.currentTokenIndex,
        totalTokens: state.totalTokens,
      }),
    [currentToken?.pageNumber, totalPages, state.currentTokenIndex, state.totalTokens],
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      start();
    }
  }, [isPlaying, pause, start]);

  /** Adjusting speed during a session also updates the persisted default for next time. */
  const handleWpmChange = useCallback(
    (wpm: number) => {
      setWpm(wpm);
      setDefaultWpm(wpm);
    },
    [setWpm, setDefaultWpm],
  );

  useReaderKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onPrevious: previous,
    onNext: next,
    onRestart: restart,
    onToggleFullscreen: isFullscreenSupported ? toggleFullscreen : undefined,
  });

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      {isFocusModeActive ? null : (
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-base">
            <Link to="/" className="hover:underline">
              {title}
            </Link>
          </h1>
          <ProgressIndicator progress={progress} />
          {isFullscreenSupported ? (
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              className="flex min-h-[44px] shrink-0 items-center text-sm font-medium text-slate-600 hover:underline dark:text-slate-400"
            >
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          ) : null}
          <Link
            to="/settings"
            className="flex min-h-[44px] shrink-0 items-center text-sm font-medium text-slate-600 hover:underline dark:text-slate-400"
          >
            Settings
          </Link>
        </header>
      )}

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <HybridReaderView
          visibleParagraphs={visibleParagraphs}
          currentTokenIndex={state.currentTokenIndex}
          playbackState={state.playbackState}
          isScrollLocked={isFocusModeActive}
        />
      </main>

      <footer className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-4">
        <PlaybackControls
          playbackState={state.playbackState}
          onPlayPause={handlePlayPause}
          onPrevious={previous}
          onNext={next}
          onRestart={restart}
        />
        {isFocusModeActive ? null : (
          <>
            <WpmControl wpm={state.wpm} onChange={handleWpmChange} />
            <KeyboardShortcutsLegend />
          </>
        )}
      </footer>
    </div>
  );
}
