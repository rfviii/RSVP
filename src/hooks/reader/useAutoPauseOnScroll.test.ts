import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAutoPauseOnScroll } from '@/hooks/reader/useAutoPauseOnScroll';

function scroll() {
  window.dispatchEvent(new Event('scroll'));
}

describe('useAutoPauseOnScroll', () => {
  it('pauses when the user scrolls while playing', () => {
    const pause = vi.fn();
    renderHook(() => useAutoPauseOnScroll(true, pause));

    scroll();

    expect(pause).toHaveBeenCalledOnce();
  });

  it('does not pause on scroll when playback was not active', () => {
    const pause = vi.fn();
    renderHook(() => useAutoPauseOnScroll(false, pause));

    scroll();

    expect(pause).not.toHaveBeenCalled();
  });

  it('removes its listener on unmount', () => {
    const pause = vi.fn();
    const { unmount } = renderHook(() => useAutoPauseOnScroll(true, pause));

    unmount();
    scroll();

    expect(pause).not.toHaveBeenCalled();
  });
});
