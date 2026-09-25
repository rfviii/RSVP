export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/**
 * How the reader behaves while RSVP is actively playing: `focus` hides
 * surrounding UI and locks scrolling (including the document layer's own
 * scrolling); `normal` keeps the interface interactive and the document
 * scrollable, optionally pausing playback on scroll per `pauseOnScroll`.
 */
export const READING_BEHAVIORS = ['normal', 'focus'] as const;

export type ReadingBehavior = (typeof READING_BEHAVIORS)[number];

export interface AppSettings {
  theme: ThemePreference;
  wpm: number;
  readingBehavior: ReadingBehavior;
  /** Whether manually scrolling the document pauses RSVP playback (Normal Mode only; Focus Mode always blocks scrolling). */
  pauseOnScroll: boolean;
}
