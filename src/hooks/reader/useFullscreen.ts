import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface UseFullscreenResult {
  isFullscreen: boolean;
  isSupported: boolean;
  toggle: () => void;
}

/** Wraps the Fullscreen API for a given element. No-ops quietly where fullscreen isn't supported or is denied. */
export function useFullscreen(elementRef: RefObject<HTMLElement>): UseFullscreenResult {
  const isSupported = typeof document !== 'undefined' && document.fullscreenEnabled;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === elementRef.current);
    }

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [elementRef]);

  const toggle = useCallback(() => {
    if (!isSupported) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      elementRef.current?.requestFullscreen().catch(() => {});
    }
  }, [elementRef, isSupported]);

  return { isFullscreen, isSupported, toggle };
}
