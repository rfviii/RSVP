import type { Paragraph } from '@/domain/text/types';
import type { PlaybackState } from '@/domain/reader/types';

export interface HybridReaderViewProps {
  visibleParagraphs: Paragraph[];
  currentTokenIndex: number;
  playbackState: PlaybackState;
  /** Focus Mode while playing: blocks the document layer's own scrolling too, not just the page's. */
  isScrollLocked?: boolean;
}

const STATE_LABEL: Record<PlaybackState, string | null> = {
  idle: null,
  playing: null,
  paused: 'Paused',
  completed: 'Finished',
};

interface RenderedToken {
  id: string;
  text: string;
  trailingText: string;
}

interface RenderedParagraph {
  id: string;
  tokens: RenderedToken[];
}

interface SplitTokens {
  readParagraphs: RenderedParagraph[];
  unreadParagraphs: RenderedParagraph[];
  currentToken: RenderedToken | null;
}

/**
 * Splits the visible window into three groups relative to the RSVP cursor:
 * already-read tokens, the single current token, and not-yet-read tokens.
 * Paragraph grouping is preserved within each group so paragraph spacing
 * still reads naturally.
 */
function splitTokensByPosition(visibleParagraphs: Paragraph[], currentTokenIndex: number): SplitTokens {
  const readParagraphs: RenderedParagraph[] = [];
  const unreadParagraphs: RenderedParagraph[] = [];
  let currentToken: RenderedToken | null = null;

  for (const paragraph of visibleParagraphs) {
    const readTokens: RenderedToken[] = [];
    const unreadTokens: RenderedToken[] = [];

    for (const sentence of paragraph.sentences) {
      for (const token of sentence.tokens) {
        const rendered: RenderedToken = { id: token.id, text: token.text, trailingText: token.trailingText };

        if (token.index < currentTokenIndex) {
          readTokens.push(rendered);
        } else if (token.index > currentTokenIndex) {
          unreadTokens.push(rendered);
        } else {
          currentToken = rendered;
        }
      }
    }

    if (readTokens.length > 0) {
      readParagraphs.push({ id: paragraph.id, tokens: readTokens });
    }
    if (unreadTokens.length > 0) {
      unreadParagraphs.push({ id: paragraph.id, tokens: unreadTokens });
    }
  }

  return { readParagraphs, unreadParagraphs, currentToken };
}

function TokenSpan({ token }: { token: RenderedToken }) {
  return (
    <span>
      {token.text}
      {token.trailingText}{' '}
    </span>
  );
}

/**
 * Renders a bounded window of surrounding document text with the current
 * RSVP token visually dominant between two guide lines, instead of hiding
 * everything but the current word. Words the cursor has already passed
 * stay visible as ordinary (dimmed) text rather than disappearing.
 *
 * The document (read/unread text) is its own scrollable layer; the current
 * token sits in a static row between the two, outside either scrollable
 * panel, so scrolling the document can never move the RSVP focal area or
 * the word itself — it just reveals more of the surrounding read/unread
 * text within each panel's own bounded window. `isScrollLocked` (Focus
 * Mode while playing) switches both panels to non-scrollable, since they
 * have their own scroll containers independent of the page's.
 */
export function HybridReaderView({
  visibleParagraphs,
  currentTokenIndex,
  playbackState,
  isScrollLocked = false,
}: HybridReaderViewProps) {
  const stateLabel = STATE_LABEL[playbackState];
  const { readParagraphs, unreadParagraphs, currentToken } = splitTokensByPosition(
    visibleParagraphs,
    currentTokenIndex,
  );
  const panelOverflowClass = isScrollLocked ? 'overflow-hidden' : 'overflow-y-auto';

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/*
        The flowing surrounding text is a visual RSVP aid, not meant to be
        read linearly — hidden from screen readers, same reasoning as the
        old word-only display: only the status label below is announced.
      */}
      <div
        aria-hidden="true"
        className="flex w-full max-w-2xl flex-col items-center text-center text-lg leading-relaxed sm:text-xl"
      >
        <div
          data-testid="document-read-panel"
          className={`no-scrollbar flex h-24 w-full flex-col justify-end overscroll-contain text-slate-400 dark:text-slate-600 sm:h-32 ${panelOverflowClass}`}
        >
          {readParagraphs.map((paragraph) => (
            <p key={paragraph.id} className="mb-2 last:mb-0">
              {paragraph.tokens.map((token) => (
                <TokenSpan key={token.id} token={token} />
              ))}
            </p>
          ))}
        </div>

        <div className="h-0.5 w-full bg-sky-400/70 dark:bg-sky-500/60" />

        <div
          data-testid="current-token"
          className="max-w-full break-words px-2 py-3 text-3xl font-semibold text-slate-900 dark:text-slate-50 sm:text-4xl"
        >
          {currentToken ? `${currentToken.text}${currentToken.trailingText}` : ' '}
        </div>

        <div className="h-0.5 w-full bg-sky-400/70 dark:bg-sky-500/60" />

        <div
          data-testid="document-unread-panel"
          className={`no-scrollbar flex h-24 w-full flex-col justify-start overscroll-contain text-slate-500 dark:text-slate-400 sm:h-32 ${panelOverflowClass}`}
        >
          {unreadParagraphs.map((paragraph) => (
            <p key={paragraph.id} className="mt-2 first:mt-0">
              {paragraph.tokens.map((token) => (
                <TokenSpan key={token.id} token={token} />
              ))}
            </p>
          ))}
        </div>
      </div>

      <span
        role="status"
        aria-live="polite"
        className="h-5 text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400"
      >
        {stateLabel}
      </span>
    </div>
  );
}
