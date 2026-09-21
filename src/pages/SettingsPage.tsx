import { Link } from 'react-router-dom';
import { WpmControl } from '@/components/reader/WpmControl';
import { useSettings } from '@/hooks/settings/useSettings';
import { THEME_PREFERENCES, type ThemePreference } from '@/types/settings';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export function SettingsPage() {
  const { settings, setTheme, setWpm } = useSettings();

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

      <section className="flex w-full max-w-sm flex-col items-center gap-3">
        <h2 className="self-start text-sm font-medium text-slate-600 dark:text-slate-400">
          Default reading speed
        </h2>
        <WpmControl wpm={settings.wpm} onChange={setWpm} />
      </section>
    </div>
  );
}
