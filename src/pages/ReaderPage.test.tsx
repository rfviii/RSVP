import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_WPM, WPM_STEP } from '@/constants/reader';
import { ReaderPage } from '@/pages/ReaderPage';
import { db } from '@/services/storage/db';
import { settingsStore } from '@/state/settings/settingsStore';
import type { TextDocument } from '@/domain/text/types';

function makeThreeWordDocument(): TextDocument {
  return {
    paragraphs: [
      {
        id: 'p0',
        pageNumber: 1,
        sentences: [
          {
            id: 's0',
            tokens: [
              {
                id: 't0',
                text: 'One',
                index: 0,
                sentenceIndex: 0,
                paragraphIndex: 0,
                pageNumber: 1,
                trailingText: '',
                punctuation: 'none',
              },
              {
                id: 't1',
                text: 'Two',
                index: 1,
                sentenceIndex: 0,
                paragraphIndex: 0,
                pageNumber: 1,
                trailingText: '',
                punctuation: 'none',
              },
              {
                id: 't2',
                text: 'Three',
                index: 2,
                sentenceIndex: 0,
                paragraphIndex: 0,
                pageNumber: 1,
                trailingText: '.',
                punctuation: 'paragraphEnd',
              },
            ],
          },
        ],
      },
    ],
  };
}

function renderReaderPage(props: Omit<Parameters<typeof ReaderPage>[0], 'title' | 'textDocument'> = {}) {
  return render(
    <MemoryRouter>
      <ReaderPage title="Sample Doc" textDocument={makeThreeWordDocument()} totalPages={1} {...props} />
    </MemoryRouter>,
  );
}

/** The hybrid reader shows read/current/unread text simultaneously, so tests must check
 *  which token is specifically marked current rather than just that its text is present. */
function getCurrentToken() {
  return screen.getByTestId('current-token');
}

beforeEach(async () => {
  await settingsStore.whenReady();
  settingsStore.setTheme('system');
  settingsStore.setWpm(DEFAULT_WPM);
  settingsStore.setReadingBehavior('normal');
  settingsStore.setPauseOnScroll(true);
  vi.useFakeTimers();
});

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  document.body.style.overflow = '';
  await db.settings.clear();
  await db.progress.clear();
});

describe('ReaderPage', () => {
  it('shows the title, first token as current, and progress before playback starts', () => {
    renderReaderPage();

    expect(screen.getByRole('heading', { name: 'Sample Doc' })).toBeInTheDocument();
    expect(getCurrentToken()).toHaveTextContent('One');
    expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_WPM} WPM`)).toBeInTheDocument();
  });

  it('shows read, current, and unread text simultaneously instead of hiding everything but the current word', () => {
    renderReaderPage();

    // All three words are visible at once (this fixture is a single short
    // paragraph, so the whole thing fits in the window) — the point of the
    // hybrid reader is that passed and upcoming words stay on screen.
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText(/Two/)).toBeInTheDocument();
    expect(screen.getByText(/Three/)).toBeInTheDocument();
    expect(getCurrentToken()).toHaveTextContent('One');
  });

  it('plays through tokens on Play and shows Pause once playing', () => {
    renderReaderPage({ initialWpm: 300 });

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(getCurrentToken()).toHaveTextContent('Two');
  });

  it('pauses and stops advancing', () => {
    renderReaderPage({ initialWpm: 300 });

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(getCurrentToken()).toHaveTextContent('Two');
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('steps forward and backward with Next and Previous, and words already passed stay visible as read text', () => {
    renderReaderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));
    expect(getCurrentToken()).toHaveTextContent('Two');
    // "One" was already passed but must still be on screen, not hidden.
    expect(screen.getByText('One')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous token' }));
    expect(getCurrentToken()).toHaveTextContent('One');
  });

  it('shows a completion state after the last token and restart returns to the first', () => {
    renderReaderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));

    expect(getCurrentToken()).toHaveTextContent('Three');
    expect(screen.getByText('Finished')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restart from the beginning' }));
    expect(getCurrentToken()).toHaveTextContent('One');
    expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
  });

  it('adjusts WPM with the increase and decrease controls, and persists the new default', () => {
    renderReaderPage({ initialWpm: 300 });

    fireEvent.click(screen.getByRole('button', { name: 'Increase words per minute' }));
    expect(screen.getByText(`${300 + WPM_STEP} WPM`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Decrease words per minute' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decrease words per minute' }));
    expect(screen.getByText(`${300 - WPM_STEP} WPM`)).toBeInTheDocument();
    expect(settingsStore.getSettings().wpm).toBe(300 - WPM_STEP);
  });

  it('toggles play/pause with the Space key', () => {
    renderReaderPage();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('navigates tokens with the arrow keys and restarts with R', () => {
    renderReaderPage();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(getCurrentToken()).toHaveTextContent('Two');

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(getCurrentToken()).toHaveTextContent('One');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'r' });
    expect(getCurrentToken()).toHaveTextContent('One');
  });

  it('ignores shortcuts while the WPM slider has focus, since arrow keys adjust it natively', () => {
    renderReaderPage();

    const slider = screen.getByLabelText('Words per minute');
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });

    expect(getCurrentToken()).toHaveTextContent('One');
  });

  it('toggles fullscreen from the header button and reflects the current state', () => {
    renderReaderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));

    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument();
    expect(document.fullscreenElement).not.toBeNull();
  });

  it('toggles fullscreen with the F key', () => {
    renderReaderPage();

    fireEvent.keyDown(window, { key: 'f' });

    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument();
  });

  it('documents the keyboard shortcuts in the UI', () => {
    renderReaderPage();

    expect(screen.getByText('Play/Pause')).toBeInTheDocument();
  });

  describe('RSVP Reading Behavior', () => {
    it('Normal Mode (default): keeps the full interface visible and does not lock scrolling while playing', () => {
      renderReaderPage({ initialWpm: 300 });

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(screen.getByRole('heading', { name: 'Sample Doc' })).toBeInTheDocument();
      expect(screen.getByLabelText('Words per minute')).toBeInTheDocument();
      expect(screen.getByText('Play/Pause')).toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('Normal Mode: pauses playback as soon as the user scrolls, preserving the current position', () => {
      renderReaderPage({ initialWpm: 300 });

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(getCurrentToken()).toHaveTextContent('Two');

      fireEvent.scroll(window);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(getCurrentToken()).toHaveTextContent('Two');

      // Playback stays paused (doesn't silently resume/drift) and the
      // position is still exactly where it was when scrolling paused it.
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(getCurrentToken()).toHaveTextContent('Two');
    });

    it('Normal Mode: scrolling while already paused does not misbehave', () => {
      renderReaderPage({ initialWpm: 300 });

      fireEvent.scroll(window);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(getCurrentToken()).toHaveTextContent('One');
    });

    it('Focus Mode: hides surrounding UI and locks scrolling only while playing, keeping playback controls', () => {
      settingsStore.setReadingBehavior('focus');
      renderReaderPage({ initialWpm: 300 });

      // Not playing yet: normal UI, unlocked scroll.
      expect(screen.getByRole('heading', { name: 'Sample Doc' })).toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe('hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(screen.queryByRole('heading', { name: 'Sample Doc' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Words per minute')).not.toBeInTheDocument();
      expect(screen.queryByText('Play/Pause')).not.toBeInTheDocument();
      // The RSVP display and its essential controls stay.
      expect(getCurrentToken()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next token' })).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('Focus Mode: restores the normal interface and scrolling on pause, preserving position, and re-enters Focus Mode on resume', () => {
      settingsStore.setReadingBehavior('focus');
      renderReaderPage({ initialWpm: 300 });

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(getCurrentToken()).toHaveTextContent('Two');

      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

      expect(screen.getByRole('heading', { name: 'Sample Doc' })).toBeInTheDocument();
      expect(screen.getByLabelText('Words per minute')).toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe('hidden');
      expect(getCurrentToken()).toHaveTextContent('Two');

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(screen.queryByRole('heading', { name: 'Sample Doc' })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
      expect(getCurrentToken()).toHaveTextContent('Two');
    });

    it('does not reset RSVP position or speed when the reading behavior setting changes mid-session', () => {
      renderReaderPage({ initialWpm: 300 });

      fireEvent.click(screen.getByRole('button', { name: 'Next token' }));
      expect(getCurrentToken()).toHaveTextContent('Two');

      act(() => {
        settingsStore.setReadingBehavior('focus');
      });

      expect(getCurrentToken()).toHaveTextContent('Two');
      expect(screen.getByText('300 WPM')).toBeInTheDocument();
    });

    it('Normal Mode: the document panels are scrollable, and scrolling one of them (not just the page) pauses playback', () => {
      renderReaderPage({ initialWpm: 300 });

      expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-y-auto');
      expect(screen.getByTestId('document-unread-panel')).toHaveClass('overflow-y-auto');

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(getCurrentToken()).toHaveTextContent('Two');

      // Scrolling happens inside the document panel itself, not the window —
      // this only pauses correctly if the listener also observes scroll
      // events from nested scrollable elements, not just page-level scroll.
      fireEvent.scroll(screen.getByTestId('document-unread-panel'));

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(getCurrentToken()).toHaveTextContent('Two');
    });

    it('does not pause on scroll when "Pause RSVP on scroll" is disabled', () => {
      settingsStore.setPauseOnScroll(false);
      renderReaderPage({ initialWpm: 300 });

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(getCurrentToken()).toHaveTextContent('Two');

      fireEvent.scroll(window);

      // Still playing: the document can be scrolled freely without pausing RSVP.
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('Focus Mode: also locks the document panels themselves from scrolling while playing, not just the page', () => {
      settingsStore.setReadingBehavior('focus');
      renderReaderPage({ initialWpm: 300 });

      expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-y-auto');

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-hidden');
      expect(screen.getByTestId('document-unread-panel')).toHaveClass('overflow-hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

      expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-y-auto');
    });
  });
});
