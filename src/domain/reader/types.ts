export const PLAYBACK_STATES = ['idle', 'playing', 'paused', 'completed'] as const;

export type PlaybackState = (typeof PLAYBACK_STATES)[number];

export interface ReaderProgress {
  currentTokenIndex: number;
  totalTokens: number;
  ratio: number;
}

export interface ReaderState {
  documentId: string | null;
  playbackState: PlaybackState;
  currentTokenIndex: number;
  totalTokens: number;
  wpm: number;
}
