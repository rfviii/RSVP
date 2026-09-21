import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

describe('App', () => {
  it('renders the home page at the root route', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /rsvp reader/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/import pdf/i)).toBeInTheDocument();
  });
});
