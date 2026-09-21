import { useEffect } from 'react';

/**
 * Pauses playback when the tab is backgrounded. RSVP relies on the reader
 * actually looking at the screen, and background tabs also have their
 * timers throttled by the browser, so continuing to "play" unseen would
 * just silently burn through the document.
 */
export function useAutoPauseOnHidden(isPlaying: boolean, pause: () => void): void {
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && isPlaying) {
        pause();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
}
