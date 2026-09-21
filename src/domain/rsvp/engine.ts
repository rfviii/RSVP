import { MAX_WPM, MIN_WPM } from '@/constants/reader';
import { MIN_TICK_DURATION_MS } from '@/constants/timing';
import { calculateProgress } from '@/domain/reader/progress';
import type { PlaybackState, ReaderProgress, ReaderState } from '@/domain/reader/types';
import { calculateTokenDuration } from '@/domain/rsvp/timing';
import type { Token } from '@/domain/text/types';

export interface RsvpEngineOptions {
  tokens: Token[];
  wpm: number;
  documentId?: string | null;
  /** Resumes from a previously saved position (e.g. reading progress). Clamped to the token list. Defaults to 0. */
  initialIndex?: number;
}

type ReaderStateListener = (state: ReaderState) => void;

function clampWpm(wpm: number): number {
  return Math.min(Math.max(wpm, MIN_WPM), MAX_WPM);
}

/**
 * The RSVP playback engine. Pure TypeScript, no React: each scheduled
 * duration is computed from the current WPM at schedule time (rather than
 * extrapolated from a fixed session start), which is what keeps timer
 * drift from accumulating over a long reading session.
 */
export class RsvpEngine {
  private readonly tokens: Token[];
  private readonly documentId: string | null;
  private currentIndex: number;
  private wpm: number;
  private playbackState: PlaybackState = 'idle';
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private tickStartedAt = 0;
  private tickDuration = 0;
  private readonly listeners = new Set<ReaderStateListener>();
  private snapshot: ReaderState;

  constructor(options: RsvpEngineOptions) {
    this.tokens = options.tokens;
    this.wpm = clampWpm(options.wpm);
    this.documentId = options.documentId ?? null;
    this.currentIndex = this.clampIndex(options.initialIndex ?? 0);
    this.snapshot = this.computeSnapshot();
  }

  /**
   * Returns a referentially stable snapshot (a fresh object is only
   * allocated when state actually changes), which is what React's
   * `useSyncExternalStore` requires to avoid re-rendering on every call.
   */
  getState(): ReaderState {
    return this.snapshot;
  }

  getCurrentToken(): Token | null {
    return this.tokens[this.currentIndex] ?? null;
  }

  getProgress(): ReaderProgress {
    return calculateProgress({
      currentTokenIndex: this.currentIndex,
      totalTokens: this.tokens.length,
    });
  }

  subscribe(listener: ReaderStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.tokens.length === 0 || this.playbackState === 'playing') {
      return;
    }
    if (this.isAtLastToken()) {
      this.currentIndex = 0;
    }
    this.setPlaybackState('playing');
    this.scheduleNextTick();
  }

  resume(): void {
    this.start();
  }

  pause(): void {
    this.clearTimer();
    if (this.playbackState === 'playing') {
      this.setPlaybackState('paused');
    }
  }

  next(): void {
    this.clearTimer();
    this.setIndex(this.currentIndex + 1);
    this.setPlaybackState(this.isAtLastToken() ? 'completed' : 'paused');
  }

  previous(): void {
    this.clearTimer();
    this.setIndex(this.currentIndex - 1);
    this.setPlaybackState(this.isAtLastToken() ? 'completed' : 'paused');
  }

  restart(): void {
    this.clearTimer();
    this.currentIndex = 0;
    this.setPlaybackState('idle');
  }

  /**
   * Changing speed mid-token doesn't restart that token's full duration:
   * whatever fraction of it was still remaining is preserved, just
   * recomputed at the new WPM, so playback doesn't visibly stutter.
   */
  setWpm(wpm: number): void {
    this.wpm = clampWpm(wpm);
    if (this.playbackState === 'playing') {
      this.clearTimer();
      this.rescheduleRemaining();
    }
    this.notify();
  }

  destroy(): void {
    this.clearTimer();
    this.listeners.clear();
  }

  private isAtLastToken(): boolean {
    return this.tokens.length > 0 && this.currentIndex === this.tokens.length - 1;
  }

  private clampIndex(index: number): number {
    const maxIndex = Math.max(this.tokens.length - 1, 0);
    return Math.min(Math.max(index, 0), maxIndex);
  }

  private setIndex(index: number): void {
    this.currentIndex = this.clampIndex(index);
  }

  private scheduleNextTick(): void {
    const currentToken = this.getCurrentToken();
    if (!currentToken) {
      this.setPlaybackState('completed');
      return;
    }
    const duration = calculateTokenDuration(currentToken, this.wpm);
    this.armTimer(duration);
  }

  private rescheduleRemaining(): void {
    const currentToken = this.getCurrentToken();
    if (!currentToken) {
      this.setPlaybackState('completed');
      return;
    }
    const elapsed = this.tickDuration > 0 ? Date.now() - this.tickStartedAt : 0;
    const remainingFraction = this.tickDuration > 0 ? Math.max(0, 1 - elapsed / this.tickDuration) : 1;
    const fullDuration = calculateTokenDuration(currentToken, this.wpm);
    const remainingDuration = Math.max(MIN_TICK_DURATION_MS, Math.round(fullDuration * remainingFraction));
    this.armTimer(remainingDuration);
  }

  private armTimer(duration: number): void {
    this.tickStartedAt = Date.now();
    this.tickDuration = duration;
    this.timerId = setTimeout(() => this.handleTick(), duration);
  }

  private handleTick(): void {
    this.timerId = null;
    if (this.isAtLastToken()) {
      this.setPlaybackState('completed');
      return;
    }
    this.currentIndex += 1;
    this.notify();
    this.scheduleNextTick();
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.notify();
  }

  private computeSnapshot(): ReaderState {
    return {
      documentId: this.documentId,
      playbackState: this.playbackState,
      currentTokenIndex: this.currentIndex,
      totalTokens: this.tokens.length,
      wpm: this.wpm,
    };
  }

  private notify(): void {
    this.snapshot = this.computeSnapshot();
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
