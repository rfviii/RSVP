import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_WPM, MIN_WPM } from '@/constants/reader';
import { RsvpEngine } from '@/domain/rsvp/engine';
import type { PunctuationType, Token } from '@/domain/text/types';

function makeTokens(words: Array<[string, PunctuationType]>): Token[] {
  return words.map(([text, punctuation], index) => ({
    id: `token-${index}`,
    text,
    index,
    sentenceIndex: 0,
    paragraphIndex: 0,
    pageNumber: 1,
    trailingText: '',
    punctuation,
  }));
}

const THREE_TOKENS = makeTokens([
  ['One', 'none'],
  ['Two', 'none'],
  ['Three', 'sentenceEnd'],
]);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RsvpEngine', () => {
  it('starts idle at the first token', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    expect(engine.getState().playbackState).toBe('idle');
    expect(engine.getState().currentTokenIndex).toBe(0);
    expect(engine.getCurrentToken()?.text).toBe('One');
  });

  it('resumes from a given initial index (e.g. saved reading progress)', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300, initialIndex: 2 });

    expect(engine.getCurrentToken()?.text).toBe('Three');
    expect(engine.getState().currentTokenIndex).toBe(2);
  });

  it('clamps an out-of-range initial index instead of crashing', () => {
    expect(new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300, initialIndex: 99 }).getState().currentTokenIndex).toBe(2);
    expect(new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300, initialIndex: -5 }).getState().currentTokenIndex).toBe(0);
  });

  it('clamps an out-of-range WPM to the allowed bounds', () => {
    const tooSlow = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 1 });
    const tooFast = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 100_000 });

    expect(tooSlow.getState().wpm).toBe(MIN_WPM);
    expect(tooFast.getState().wpm).toBe(MAX_WPM);
  });

  it('advances tokens automatically while playing, at 200ms/token for 300 WPM', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    expect(engine.getState().playbackState).toBe('playing');
    expect(engine.getCurrentToken()?.text).toBe('One');

    vi.advanceTimersByTime(200);
    expect(engine.getCurrentToken()?.text).toBe('Two');

    vi.advanceTimersByTime(200);
    expect(engine.getCurrentToken()?.text).toBe('Three');
  });

  it('completes after the final token has been shown for its own duration', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    vi.advanceTimersByTime(200); // -> Two
    vi.advanceTimersByTime(200); // -> Three (sentenceEnd, 440ms)

    expect(engine.getState().playbackState).toBe('playing');

    vi.advanceTimersByTime(440);

    expect(engine.getState().playbackState).toBe('completed');
    expect(engine.getCurrentToken()?.text).toBe('Three');
  });

  it('pauses and stops advancing until resumed', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    vi.advanceTimersByTime(200); // -> Two
    engine.pause();
    expect(engine.getState().playbackState).toBe('paused');

    vi.advanceTimersByTime(1000);
    expect(engine.getCurrentToken()?.text).toBe('Two');

    engine.resume();
    expect(engine.getState().playbackState).toBe('playing');
    vi.advanceTimersByTime(200);
    expect(engine.getCurrentToken()?.text).toBe('Three');
  });

  it('restarting from a completed state and pressing start plays from the beginning', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    vi.advanceTimersByTime(200 + 200 + 440);
    expect(engine.getState().playbackState).toBe('completed');

    engine.start();
    expect(engine.getState().playbackState).toBe('playing');
    expect(engine.getCurrentToken()?.text).toBe('One');
  });

  it('steps forward and backward manually, pausing any active playback', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    engine.next();
    expect(engine.getState().playbackState).toBe('paused');
    expect(engine.getCurrentToken()?.text).toBe('Two');

    engine.next();
    expect(engine.getCurrentToken()?.text).toBe('Three');
    expect(engine.getState().playbackState).toBe('completed');

    engine.previous();
    expect(engine.getCurrentToken()?.text).toBe('Two');
    expect(engine.getState().playbackState).toBe('paused');
  });

  it('clamps navigation at the first and last token', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.previous();
    expect(engine.getCurrentToken()?.text).toBe('One');

    engine.next();
    engine.next();
    engine.next();
    expect(engine.getCurrentToken()?.text).toBe('Three');
    expect(engine.getState().playbackState).toBe('completed');
  });

  it('does not advance once a timer is cleared by a manual step', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    engine.next();
    vi.advanceTimersByTime(10_000);

    expect(engine.getCurrentToken()?.text).toBe('Two');
  });

  it('restart resets to the first token and an idle state', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    vi.advanceTimersByTime(200);
    engine.restart();

    expect(engine.getState()).toMatchObject({ currentTokenIndex: 0, playbackState: 'idle' });

    vi.advanceTimersByTime(10_000);
    expect(engine.getCurrentToken()?.text).toBe('One');
  });

  it('applies a new WPM to subsequent ticks without losing the current position', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    engine.setWpm(600); // 100ms/token going forward

    vi.advanceTimersByTime(100);
    expect(engine.getCurrentToken()?.text).toBe('Two');
  });

  it('preserves the remaining fraction of the current token when WPM changes mid-tick', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start(); // 200ms for "One"
    vi.advanceTimersByTime(100); // halfway through "One"

    engine.setWpm(600); // full duration would now be 100ms; half of that remains: 50ms

    vi.advanceTimersByTime(49);
    expect(engine.getCurrentToken()?.text).toBe('One');

    vi.advanceTimersByTime(1);
    expect(engine.getCurrentToken()?.text).toBe('Two');
  });

  it('does not schedule a near-instant tick when a WPM change happens right at the tick boundary', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    engine.start();
    vi.advanceTimersByTime(199); // 1ms shy of the natural tick
    engine.setWpm(1000);

    vi.advanceTimersByTime(15); // less than MIN_TICK_DURATION_MS
    expect(engine.getCurrentToken()?.text).toBe('One');

    vi.advanceTimersByTime(1);
    expect(engine.getCurrentToken()?.text).toBe('Two');
  });

  it('reports progress consistent with the current token index', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    expect(engine.getProgress()).toEqual({ currentTokenIndex: 0, totalTokens: 3, ratio: 1 / 3 });

    engine.next();
    expect(engine.getProgress().ratio).toBeCloseTo(2 / 3);
  });

  it('notifies subscribers on every state change and stops after unsubscribing', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });
    const states: string[] = [];
    const unsubscribe = engine.subscribe((state) => states.push(state.playbackState));

    engine.start();
    unsubscribe();
    engine.pause();

    expect(states).toContain('playing');
    expect(states).not.toContain('paused');
  });

  it('returns a referentially stable snapshot until state actually changes', () => {
    const engine = new RsvpEngine({ tokens: THREE_TOKENS, wpm: 300 });

    const first = engine.getState();
    const second = engine.getState();
    expect(second).toBe(first);

    engine.next();
    const third = engine.getState();
    expect(third).not.toBe(first);
    expect(engine.getState()).toBe(third);
  });

  it('does nothing harmful for an empty token list', () => {
    const engine = new RsvpEngine({ tokens: [], wpm: 300 });

    expect(engine.getCurrentToken()).toBeNull();
    expect(() => engine.start()).not.toThrow();
    expect(engine.getState().playbackState).toBe('idle');
    expect(engine.getProgress()).toEqual({ currentTokenIndex: 0, totalTokens: 0, ratio: 0 });
  });
});
