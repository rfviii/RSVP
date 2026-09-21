import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyboardShortcutsLegend } from '@/components/reader/KeyboardShortcutsLegend';

describe('KeyboardShortcutsLegend', () => {
  it('documents every reader keyboard shortcut', () => {
    render(<KeyboardShortcutsLegend />);

    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('Play/Pause')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('Fullscreen')).toBeInTheDocument();
  });
});
