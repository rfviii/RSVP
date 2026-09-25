import { useEffect } from 'react';

/**
 * Pauses playback as soon as the user scrolls, for Normal Mode: the reader
 * stays fully interactive while RSVP plays, but the user scrolling implies
 * their attention has moved away from the RSVP display. The scroll itself
 * is never intercepted (no preventDefault), only observed.
 *
 * Registered on `window` with `capture: true`: the document layer's own
 * read/unread panels are independently scrollable elements, and `scroll`
 * events don't bubble, so a capturing listener on an ancestor is what's
 * needed to observe scrolling inside them (not just page-level scroll).
 */
export function useAutoPauseOnScroll(isPlaying: boolean, pause: () => void): void {
  useEffect(() => {
    function handleScroll() {
      if (isPlaying) {
        pause();
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  });
}
