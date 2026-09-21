export interface Throttled<Args extends unknown[]> {
  (...args: Args): void;
  /** Runs any pending trailing call immediately. */
  flush: () => void;
  /** Discards any pending trailing call without running it. */
  cancel: () => void;
}

/**
 * Calls `fn` immediately if at least `intervalMs` has passed since the last
 * call, otherwise schedules a single trailing call for when that interval
 * elapses (using only the most recent arguments). This guarantees periodic
 * checkpoints during a burst of rapid calls while still capturing the final
 * settled value once the burst ends.
 */
export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, intervalMs: number): Throttled<Args> {
  let lastCallAt = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  function invoke(args: Args): void {
    lastCallAt = Date.now();
    pendingArgs = null;
    fn(...args);
  }

  function throttled(...args: Args): void {
    const elapsed = Date.now() - lastCallAt;

    if (elapsed >= intervalMs) {
      invoke(args);
      return;
    }

    pendingArgs = args;
    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (pendingArgs) {
          invoke(pendingArgs);
        }
      }, intervalMs - elapsed);
    }
  }

  throttled.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs) {
      invoke(pendingArgs);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  return throttled;
}
