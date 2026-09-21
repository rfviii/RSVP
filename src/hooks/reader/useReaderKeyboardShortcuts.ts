import { useEffect } from 'react';

export interface ReaderKeyboardActions {
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
  onToggleFullscreen?: () => void;
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

/** Space: play/pause, Left/Right: previous/next, R: restart, F: fullscreen. Ignored while typing in a field. */
export function useReaderKeyboardShortcuts(actions: ReaderKeyboardActions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTextInputTarget(event.target)) {
        return;
      }

      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          actions.onPlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          actions.onPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          actions.onNext();
          break;
        case 'r':
        case 'R':
          actions.onRestart();
          break;
        case 'f':
        case 'F':
          actions.onToggleFullscreen?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
}
