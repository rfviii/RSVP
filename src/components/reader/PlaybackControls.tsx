import { memo } from 'react';
import type { PlaybackState } from '@/domain/reader/types';

export interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
}

const CONTROL_BUTTON_CLASS =
  'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:px-4';

export const PlaybackControls = memo(function PlaybackControls({
  playbackState,
  onPlayPause,
  onPrevious,
  onNext,
  onRestart,
}: PlaybackControlsProps) {
  const isPlaying = playbackState === 'playing';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        className={CONTROL_BUTTON_CLASS}
        onClick={onPrevious}
        aria-label="Previous token"
        title={'Previous (←)'}
      >
        Previous
      </button>
      <button
        type="button"
        className={`${CONTROL_BUTTON_CLASS} !bg-sky-700 !px-4 !text-white hover:!bg-sky-600 dark:!bg-sky-700 dark:!text-white dark:hover:!bg-sky-600 sm:!px-6`}
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className={CONTROL_BUTTON_CLASS}
        onClick={onNext}
        aria-label="Next token"
        title={'Next (→)'}
      >
        Next
      </button>
      <button
        type="button"
        className={CONTROL_BUTTON_CLASS}
        onClick={onRestart}
        aria-label="Restart from the beginning"
        title="Restart (R)"
      >
        Restart
      </button>
    </div>
  );
});
