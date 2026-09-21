import { memo } from 'react';

const SHORTCUTS: Array<[string, string]> = [
  ['Space', 'Play/Pause'],
  ['← →', 'Navigate'],
  ['R', 'Restart'],
  ['F', 'Fullscreen'],
];

/** Documents the reader's keyboard shortcuts (spec §22). Hidden on small/touch screens where a keyboard is unlikely. */
export const KeyboardShortcutsLegend = memo(function KeyboardShortcutsLegend() {
  return (
    <p className="hidden text-center text-xs text-slate-500 dark:text-slate-400 sm:block">
      {SHORTCUTS.map(([key, action], index) => (
        <span key={key}>
          {index > 0 ? <span className="mx-2">·</span> : null}
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[0.7rem] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {key}
          </kbd>{' '}
          {action}
        </span>
      ))}
    </p>
  );
});
