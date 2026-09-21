import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/services/storage/db';
import { loadProgress } from '@/services/storage/progressRepository';
import { useProgressPersistence } from '@/hooks/reader/useProgressPersistence';

// Real timers throughout: the throttle's own interval timing is already
// covered in isolation (with a mock callback) by utils/throttle.test.ts.
// Mixing fake timers with real IndexedDB calls here risked hanging, since
// fake-indexeddb's request completion can depend on real timer/microtask
// scheduling that vi.useFakeTimers() would otherwise freeze.

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function renderPersistence(initialIndex: number, isPlaying: boolean) {
  return renderHook(
    ({ index, playing }: { index: number; playing: boolean }) =>
      useProgressPersistence('doc-1', index, 10, playing),
    { initialProps: { index: initialIndex, playing: isPlaying } },
  );
}

beforeEach(async () => {
  await db.progress.clear();
});

afterEach(async () => {
  setVisibility('visible');
  await db.progress.clear();
});

describe('useProgressPersistence', () => {
  it('saves the first position immediately while playing', async () => {
    renderPersistence(0, true);

    expect((await loadProgress('doc-1'))?.currentTokenIndex).toBe(0);
  });

  it('does not save a rapid second change immediately while still playing (throttled)', async () => {
    const { rerender } = renderPersistence(0, true);
    await loadProgress('doc-1'); // let the first (immediate) save land

    rerender({ index: 1, playing: true });

    expect((await loadProgress('doc-1'))?.currentTokenIndex).toBe(0);
  });

  it('saves immediately when not playing (manual navigation, restart, or pausing)', async () => {
    const { rerender } = renderPersistence(0, true);
    await loadProgress('doc-1');

    // Manual "Next" pauses playback in the engine, so isPlaying flips to false.
    rerender({ index: 1, playing: false });

    expect((await loadProgress('doc-1'))?.currentTokenIndex).toBe(1);
  });

  it('flushes a pending throttled save immediately when the tab becomes hidden', async () => {
    const { rerender } = renderPersistence(0, true);
    await loadProgress('doc-1');

    rerender({ index: 1, playing: true });
    setVisibility('hidden');

    expect((await loadProgress('doc-1'))?.currentTokenIndex).toBe(1);
  });

  it('flushes a pending save on unmount', async () => {
    const { rerender, unmount } = renderPersistence(0, true);
    await loadProgress('doc-1');

    rerender({ index: 1, playing: true });
    unmount();

    expect((await loadProgress('doc-1'))?.currentTokenIndex).toBe(1);
  });

  it('does nothing without a documentId', async () => {
    renderHook(() => useProgressPersistence(null, 3, 10, false));

    expect(await loadProgress('doc-1')).toBeUndefined();
  });
});
