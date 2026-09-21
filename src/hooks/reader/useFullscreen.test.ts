import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFullscreen } from '@/hooks/reader/useFullscreen';

function makeElementRef() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return { current: element };
}

describe('useFullscreen', () => {
  it('reports supported and starts out of fullscreen', () => {
    const ref = makeElementRef();
    const { result } = renderHook(() => useFullscreen(ref));

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isFullscreen).toBe(false);
  });

  it('enters fullscreen on toggle and reflects it in state', async () => {
    const ref = makeElementRef();
    const { result } = renderHook(() => useFullscreen(ref));

    await act(async () => {
      result.current.toggle();
    });

    expect(result.current.isFullscreen).toBe(true);
    expect(document.fullscreenElement).toBe(ref.current);
  });

  it('exits fullscreen on a second toggle', async () => {
    const ref = makeElementRef();
    const { result } = renderHook(() => useFullscreen(ref));

    await act(async () => {
      result.current.toggle();
    });
    await act(async () => {
      result.current.toggle();
    });

    expect(result.current.isFullscreen).toBe(false);
    expect(document.fullscreenElement).toBeNull();
  });
});
