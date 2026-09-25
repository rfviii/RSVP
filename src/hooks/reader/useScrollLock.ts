import { useEffect } from 'react';

/**
 * Prevents page scrolling while `isLocked` is true (Focus Mode while RSVP
 * is playing), restoring whatever the body's overflow was before.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
}
