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
        sentences: [
          {
            id: 's0',
            tokens: [
              { id: 't0', text: 'One', index: 0, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
              { id: 't1', text: 'Two', index: 1, sentenceIndex: 0, paragraphIndex: 0, punctuation: 'none' },
              {
                id: 't2',
                text: 'Three',
                index: 2,
                sentenceIndex: 0,
                paragraphIndex: 0,
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
      <ReaderPage title="Sample Doc" textDocument={makeThreeWordDocument()} {...props} />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await settingsStore.whenReady();
  settingsStore.setTheme('system');
  settingsStore.setWpm(DEFAULT_WPM);
  vi.useFakeTimers();
});

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  await db.settings.clear();
  await db.progress.clear();
});

describe('ReaderPage', () => {
  it('shows the title, first token, and progress before playback starts', () => {
    renderReaderPage();

    expect(screen.getByRole('heading', { name: 'Sample Doc' })).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_WPM} WPM`)).toBeInTheDocument();
  });

  it('plays through tokens on Play and shows Pause once playing', () => {
    renderReaderPage({ initialWpm: 300 });

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Two')).toBeInTheDocument();
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
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('steps forward and backward with Next and Previous', () => {
    renderReaderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));
    expect(screen.getByText('Two')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous token' }));
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('shows a completion state after the last token and restart returns to the first', () => {
    renderReaderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next token' }));

    expect(screen.getByText('Three')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restart from the beginning' }));
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
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
    expect(screen.getByText('Two')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('One')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('ignores shortcuts while the WPM slider has focus, since arrow keys adjust it natively', () => {
    renderReaderPage();

    const slider = screen.getByLabelText('Words per minute');
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });

    expect(screen.getByText('One')).toBeInTheDocument();
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
});
