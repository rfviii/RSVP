import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAutoPauseOnHidden } from '@/hooks/reader/useAutoPauseOnHidden';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  setVisibility('visible');
});

describe('useAutoPauseOnHidden', () => {
  it('pauses when the tab is hidden while playing', () => {
    const pause = vi.fn();
    renderHook(() => useAutoPauseOnHidden(true, pause));

    setVisibility('hidden');

    expect(pause).toHaveBeenCalledOnce();
  });

  it('does not pause when the tab is hidden but playback was not active', () => {
    const pause = vi.fn();
    renderHook(() => useAutoPauseOnHidden(false, pause));

    setVisibility('hidden');

    expect(pause).not.toHaveBeenCalled();
  });

  it('does not fire when the tab becomes visible again', () => {
    const pause = vi.fn();
    renderHook(() => useAutoPauseOnHidden(true, pause));

    setVisibility('visible');

    expect(pause).not.toHaveBeenCalled();
  });
});
