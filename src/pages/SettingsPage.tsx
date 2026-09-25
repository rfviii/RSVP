import { Link } from 'react-router-dom';
import { WpmControl } from '@/components/reader/WpmControl';
import { useSettings } from '@/hooks/settings/useSettings';
import { READING_BEHAVIORS, THEME_PREFERENCES, type ReadingBehavior, type ThemePreference } from '@/types/settings';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const READING_BEHAVIOR_LABELS: Record<ReadingBehavior, { title: string; description: string }> = {
  normal: {
    title: 'Normal Mode',
    description: 'Keep the interface visible and the document scrollable while RSVP is playing.',
  },
  focus: {
    title: 'Focus Mode',
    description: 'Hide surrounding content and prevent scrolling while RSVP is playing.',
  },
};

export function SettingsPage() {
  const { settings, setTheme, setWpm, setReadingBehavior, setPauseOnScroll } = useSettings();

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-white px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex w-full max-w-sm items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <Link
          to="/"
          className="flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          Done
        </Link>
      </header>

      <fieldset className="m-0 flex w-full max-w-sm flex-col gap-3 border-0 p-0">
        <legend className="p-0 text-sm font-medium text-slate-600 dark:text-slate-400">Theme</legend>
        <div className="flex gap-2">
          {THEME_PREFERENCES.map((theme) => {
            const isSelected = settings.theme === theme;
            return (
              <label key={theme} className="flex-1">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={isSelected}
                  onChange={() => setTheme(theme)}
                  className="peer sr-only"
                />
                <span
                  className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-400 ${
                    isSelected
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {THEME_LABELS[theme]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="m-0 flex w-full max-w-sm flex-col gap-3 border-0 p-0">
        <legend className="p-0 text-sm font-medium text-slate-600 dark:text-slate-400">
          RSVP Reading Behavior
        </legend>
        <div className="flex flex-col gap-2">
          {READING_BEHAVIORS.map((behavior) => {
            const isSelected = settings.readingBehavior === behavior;
            const { title, description } = READING_BEHAVIOR_LABELS[behavior];
            return (
              <label key={behavior}>
                <input
                  type="radio"
                  name="readingBehavior"
                  value={behavior}
                  checked={isSelected}
                  onChange={() => setReadingBehavior(behavior)}
                  className="peer sr-only"
                />
                <span
                  className={`block cursor-pointer rounded-xl px-4 py-3 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-400 ${
                    isSelected
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="block text-sm font-medium">{title}</span>
                  <span className={isSelected ? 'text-xs text-sky-100' : 'text-xs text-slate-600 dark:text-slate-400'}>
                    {description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <section className="flex w-full max-w-sm flex-col gap-1">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
          <input
            type="checkbox"
            checked={settings.pauseOnScroll}
            onChange={(event) => setPauseOnScroll(event.target.checked)}
            className="h-5 w-5 shrink-0 accent-sky-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Pause RSVP on scroll
            </span>
            <span className="block text-xs text-slate-600 dark:text-slate-400">
              In Normal Mode, manually scrolling the document pauses RSVP. Has no effect in Focus Mode, which
              already blocks scrolling.
            </span>
          </span>
        </label>
      </section>

      <section className="flex w-full max-w-sm flex-col items-center gap-3">
        <h2 className="self-start text-sm font-medium text-slate-600 dark:text-slate-400">
          Default reading speed
        </h2>
        <WpmControl wpm={settings.wpm} onChange={setWpm} />
      </section>
    </div>
  );
}
