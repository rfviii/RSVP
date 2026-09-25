import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HybridReaderView } from '@/components/reader/HybridReaderView';
import type { Paragraph } from '@/domain/text/types';

function makeParagraph(id: string, words: Array<[string, number]>, pageNumber = 1): Paragraph {
  return {
    id,
    pageNumber,
    sentences: [
      {
        id: `${id}-s0`,
        tokens: words.map(([text, index]) => ({
          id: `${id}-t${index}`,
          text,
          index,
          sentenceIndex: 0,
          paragraphIndex: 0,
          pageNumber,
          trailingText: '',
          punctuation: 'none',
        })),
      },
    ],
  };
}

describe('HybridReaderView', () => {
  it('marks the current token distinctly and keeps read and unread words visible as ordinary text', () => {
    const paragraph = makeParagraph('p0', [
      ['The', 0],
      ['quick', 1],
      ['fox', 2],
      ['jumps', 3],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={2} playbackState="paused" />);

    expect(screen.getByTestId('current-token')).toHaveTextContent('fox');
    // Already-read and not-yet-read words stay on screen, not hidden.
    expect(screen.getByText('The', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('quick', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('jumps', { exact: false })).toBeInTheDocument();
  });

  it('shows no read text before the very first token, without erroring', () => {
    const paragraph = makeParagraph('p0', [
      ['Start', 0],
      ['here', 1],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={0} playbackState="idle" />);

    expect(screen.getByTestId('current-token')).toHaveTextContent('Start');
    expect(screen.getByText('here', { exact: false })).toBeInTheDocument();
  });

  it('shows no unread text after the very last token, without erroring', () => {
    const paragraph = makeParagraph('p0', [
      ['Almost', 0],
      ['done', 1],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={1} playbackState="completed" />);

    expect(screen.getByTestId('current-token')).toHaveTextContent('done');
    expect(screen.getByText('Almost', { exact: false })).toBeInTheDocument();
  });

  it('announces the playback state for paused and finished, but not idle or playing', () => {
    const paragraph = makeParagraph('p0', [['Word', 0]]);

    const { rerender } = render(
      <HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={0} playbackState="paused" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Paused');

    rerender(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={0} playbackState="completed" />);
    expect(screen.getByRole('status')).toHaveTextContent('Finished');

    rerender(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={0} playbackState="playing" />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('renders faithful trailing punctuation instead of dropping it', () => {
    const paragraph: Paragraph = {
      id: 'p0',
      pageNumber: 1,
      sentences: [
        {
          id: 'p0-s0',
          tokens: [
            {
              id: 't0',
              text: 'Well',
              index: 0,
              sentenceIndex: 0,
              paragraphIndex: 0,
              pageNumber: 1,
              trailingText: ',',
              punctuation: 'comma',
            },
            {
              id: 't1',
              text: 'then',
              index: 1,
              sentenceIndex: 0,
              paragraphIndex: 0,
              pageNumber: 1,
              trailingText: '.',
              punctuation: 'sentenceEnd',
            },
          ],
        },
      ],
    };

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={1} playbackState="paused" />);

    expect(screen.getByText('Well,')).toBeInTheDocument();
    expect(screen.getByTestId('current-token')).toHaveTextContent('then.');
  });

  it('makes the document panels scrollable by default (Normal Mode)', () => {
    const paragraph = makeParagraph('p0', [
      ['One', 0],
      ['Two', 1],
      ['Three', 2],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={1} playbackState="paused" />);

    expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('document-unread-panel')).toHaveClass('overflow-y-auto');
  });

  it('hides the scrollbar on both document panels without disabling scrolling', () => {
    const paragraph = makeParagraph('p0', [
      ['One', 0],
      ['Two', 1],
      ['Three', 2],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={1} playbackState="paused" />);

    // .no-scrollbar only hides the scrollbar visually (via CSS); it must be
    // paired with overflow-y-auto (asserted above), never overflow-hidden,
    // or scrolling itself would be disabled instead of just made invisible.
    expect(screen.getByTestId('document-read-panel')).toHaveClass('no-scrollbar', 'overflow-y-auto');
    expect(screen.getByTestId('document-unread-panel')).toHaveClass('no-scrollbar', 'overflow-y-auto');
  });

  it('locks the document panels from scrolling when isScrollLocked is set (Focus Mode)', () => {
    const paragraph = makeParagraph('p0', [
      ['One', 0],
      ['Two', 1],
      ['Three', 2],
    ]);

    render(
      <HybridReaderView
        visibleParagraphs={[paragraph]}
        currentTokenIndex={1}
        playbackState="playing"
        isScrollLocked
      />,
    );

    expect(screen.getByTestId('document-read-panel')).toHaveClass('overflow-hidden');
    expect(screen.getByTestId('document-unread-panel')).toHaveClass('overflow-hidden');
  });

  it('keeps the current token outside of either scrollable document panel', () => {
    const paragraph = makeParagraph('p0', [
      ['One', 0],
      ['Two', 1],
      ['Three', 2],
    ]);

    render(<HybridReaderView visibleParagraphs={[paragraph]} currentTokenIndex={1} playbackState="paused" />);

    const currentToken = screen.getByTestId('current-token');
    const readPanel = screen.getByTestId('document-read-panel');
    const unreadPanel = screen.getByTestId('document-unread-panel');

    expect(readPanel.contains(currentToken)).toBe(false);
    expect(unreadPanel.contains(currentToken)).toBe(false);
  });
});
