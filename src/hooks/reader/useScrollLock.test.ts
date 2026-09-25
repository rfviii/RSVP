import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScrollLock } from '@/hooks/reader/useScrollLock';

afterEach(() => {
  document.body.style.overflow = '';
});

describe('useScrollLock', () => {
  it('hides overflow while locked', () => {
    renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('leaves overflow untouched when not locked', () => {
    renderHook(() => useScrollLock(false));

    expect(document.body.style.overflow).toBe('');
  });

  it('restores the previous overflow value once unlocked', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = renderHook(({ locked }) => useScrollLock(locked), {
      initialProps: { locked: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ locked: false });

    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores the previous overflow value on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
  });
});
