import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttle } from '@/utils/throttle';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('throttle', () => {
  it('invokes immediately on the first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('suppresses calls within the interval, keeping only the latest arguments', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');
    throttled('b');
    throttled('c');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs a trailing call once the interval elapses', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');
    throttled('b');

    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('allows an immediate call again once enough time has passed', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');
    vi.advanceTimersByTime(1000);
    throttled('b');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('flush runs a pending trailing call immediately', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');
    throttled('b');
    throttled.flush();

    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('flush does nothing when there is no pending call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled.flush();

    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel discards a pending trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled('a');
    throttled('b');
    throttled.cancel();

    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
