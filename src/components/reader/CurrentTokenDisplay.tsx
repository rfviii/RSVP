import type { PlaybackState } from '@/domain/reader/types';

export interface CurrentTokenDisplayProps {
  text: string | null;
  playbackState: PlaybackState;
}

const STATE_LABEL: Record<PlaybackState, string | null> = {
  idle: null,
  playing: null,
  paused: 'Paused',
  completed: 'Finished',
};

export function CurrentTokenDisplay({ text, playbackState }: CurrentTokenDisplayProps) {
  const stateLabel = STATE_LABEL[playbackState];

  return (
    <div className="flex min-h-[4rem] flex-col items-center justify-center gap-2 py-4">
      {/*
        No aria-live here: at RSVP speed the word changes multiple times a
        second, and a screen reader trying to announce every change would
        be unusable. The word is still present as ordinary text for anyone
        inspecting the page; only the (rare) state change below is announced.
      */}
      <p className="max-w-full break-words text-center text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl md:text-6xl">
        {text ?? '—'}
      </p>
      <span
        role="status"
        aria-live="polite"
        className="h-5 text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400"
      >
        {stateLabel}
      </span>
    </div>
  );
}
