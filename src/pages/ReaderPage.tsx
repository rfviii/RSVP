import { useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CurrentTokenDisplay } from '@/components/reader/CurrentTokenDisplay';
import { KeyboardShortcutsLegend } from '@/components/reader/KeyboardShortcutsLegend';
import { PlaybackControls } from '@/components/reader/PlaybackControls';
import { ProgressIndicator } from '@/components/reader/ProgressIndicator';
import { WpmControl } from '@/components/reader/WpmControl';
import { flattenTextDocumentTokens } from '@/domain/rsvp';
import type { TextDocument } from '@/domain/text/types';
import { useAutoPauseOnHidden } from '@/hooks/reader/useAutoPauseOnHidden';
import { useFullscreen } from '@/hooks/reader/useFullscreen';
import { useProgressPersistence } from '@/hooks/reader/useProgressPersistence';
import { useReaderKeyboardShortcuts } from '@/hooks/reader/useReaderKeyboardShortcuts';
import { useRsvpEngine } from '@/hooks/reader/useRsvpEngine';
import { useSettings } from '@/hooks/settings/useSettings';

export interface ReaderPageProps {
  title: string;
  textDocument: TextDocument;
  documentId?: string;
  initialWpm?: number;
  initialIndex?: number;
}

export function ReaderPage({
  title,
  textDocument,
  documentId,
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

  useProgressPersistence(
    documentId ?? null,
    state.currentTokenIndex,
    state.totalTokens,
    state.playbackState === 'playing',
  );
  useAutoPauseOnHidden(state.playbackState === 'playing', pause);

  const { isFullscreen, isSupported: isFullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen(containerRef);

  const progress = useMemo(
    () => ({
      currentTokenIndex: state.currentTokenIndex,
      totalTokens: state.totalTokens,
      ratio: state.totalTokens === 0 ? 0 : (state.currentTokenIndex + 1) / state.totalTokens,
    }),
    [state.currentTokenIndex, state.totalTokens],
  );

  const handlePlayPause = useCallback(() => {
    if (state.playbackState === 'playing') {
      pause();
    } else {
      start();
    }
  }, [state.playbackState, pause, start]);

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

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <CurrentTokenDisplay text={currentToken?.text ?? null} playbackState={state.playbackState} />
      </main>

      <footer className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-4">
        <PlaybackControls
          playbackState={state.playbackState}
          onPlayPause={handlePlayPause}
          onPrevious={previous}
          onNext={next}
          onRestart={restart}
        />
        <WpmControl wpm={state.wpm} onChange={handleWpmChange} />
        <KeyboardShortcutsLegend />
      </footer>
    </div>
  );
}
