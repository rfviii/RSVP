import { memo } from 'react';
import { MAX_WPM, MIN_WPM, WPM_STEP } from '@/constants/reader';

export interface WpmControlProps {
  wpm: number;
  onChange: (wpm: number) => void;
}

const STEP_BUTTON_CLASS =
  'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 text-lg text-slate-900 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';

export const WpmControl = memo(function WpmControl({ wpm, onChange }: WpmControlProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={STEP_BUTTON_CLASS}
          onClick={() => onChange(wpm - WPM_STEP)}
          disabled={wpm <= MIN_WPM}
          aria-label="Decrease words per minute"
        >
          −
        </button>
        <span className="min-w-[7ch] text-center text-base font-medium text-slate-900 dark:text-slate-100">
          {wpm} WPM
        </span>
        <button
          type="button"
          className={STEP_BUTTON_CLASS}
          onClick={() => onChange(wpm + WPM_STEP)}
          disabled={wpm >= MAX_WPM}
          aria-label="Increase words per minute"
        >
          +
        </button>
      </div>
      <input
        type="range"
        className="w-48 accent-sky-500"
        min={MIN_WPM}
        max={MAX_WPM}
        step={WPM_STEP}
        value={wpm}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Words per minute"
      />
    </div>
  );
});
