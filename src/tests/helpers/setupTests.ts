import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';

// jsdom does not implement matchMedia; provide a minimal stub so code that
// reads the OS color-scheme preference (theme handling) doesn't crash.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom does not implement the Fullscreen API; provide a minimal working
// simulation so components using it can be exercised in tests.
if (typeof document !== 'undefined' && document.exitFullscreen === undefined) {
  let currentFullscreenElement: Element | null = null;

  Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => currentFullscreenElement,
  });

  document.exitFullscreen = function exitFullscreen(this: Document) {
    currentFullscreenElement = null;
    this.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  };

  HTMLElement.prototype.requestFullscreen = function requestFullscreen(this: HTMLElement) {
    currentFullscreenElement = this;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve() as ReturnType<HTMLElement['requestFullscreen']>;
  };

  // Reset between tests so one test's fullscreen state can't leak into the next.
  afterEach(() => {
    currentFullscreenElement = null;
  });
}
