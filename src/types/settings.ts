export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export interface AppSettings {
  theme: ThemePreference;
  wpm: number;
}
