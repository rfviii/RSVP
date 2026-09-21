import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { RsvpEngine, type RsvpEngineOptions } from '@/domain/rsvp';
import type { ReaderState } from '@/domain/reader/types';
import type { Token } from '@/domain/text/types';

export interface UseRsvpEngineResult {
  state: ReaderState;
  currentToken: Token | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  setWpm: (wpm: number) => void;
}

/**
 * Bridges the framework-agnostic RsvpEngine into React via
 * useSyncExternalStore. `tokens`/`documentId` identity controls when a new
 * engine is created; changing `wpm` after mount does not recreate it (call
 * the returned `setWpm` instead).
 *
 * The returned action functions are stable across renders (tied only to
 * `engine`'s identity), so consumers can pass them to `React.memo`-wrapped
 * children without those children re-rendering on every RSVP tick.
 */
export function useRsvpEngine(options: RsvpEngineOptions): UseRsvpEngineResult {
  const { tokens, documentId } = options;

  const engine = useMemo(
    () => new RsvpEngine({ tokens, wpm: options.wpm, documentId, initialIndex: options.initialIndex }),
    // wpm is intentionally excluded: it is a live-adjustable setting, not an identity input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, documentId],
  );

  useEffect(() => () => engine.destroy(), [engine]);

  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
  );

  const start = useCallback(() => engine.start(), [engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const resume = useCallback(() => engine.resume(), [engine]);
  const next = useCallback(() => engine.next(), [engine]);
  const previous = useCallback(() => engine.previous(), [engine]);
  const restart = useCallback(() => engine.restart(), [engine]);
  const setWpm = useCallback((wpm: number) => engine.setWpm(wpm), [engine]);

  return {
    state,
    currentToken: engine.getCurrentToken(),
    start,
    pause,
    resume,
    next,
    previous,
    restart,
    setWpm,
  };
}
