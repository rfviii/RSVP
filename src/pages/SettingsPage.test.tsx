import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WPM_STEP } from '@/constants/reader';
import { SettingsPage } from '@/pages/SettingsPage';
import { db } from '@/services/storage/db';
import { settingsStore } from '@/state/settings/settingsStore';

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await settingsStore.whenReady();
  settingsStore.setTheme('system');
  settingsStore.setWpm(300);
  settingsStore.setReadingBehavior('normal');
  settingsStore.setPauseOnScroll(true);
});

afterEach(async () => {
  await db.settings.clear();
});

describe('SettingsPage', () => {
  it('shows the current theme and WPM preference', () => {
    renderSettingsPage();

    expect(screen.getByRole('radio', { name: 'System', checked: true })).toBeInTheDocument();
    expect(screen.getByText('300 WPM')).toBeInTheDocument();
  });

  it('selecting a theme updates and persists it', () => {
    renderSettingsPage();

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark', checked: true })).toBeInTheDocument();
    expect(settingsStore.getSettings().theme).toBe('dark');
  });

  it('adjusting the WPM control updates and persists the default speed', () => {
    renderSettingsPage();

    fireEvent.click(screen.getByRole('button', { name: 'Increase words per minute' }));

    expect(screen.getByText(`${300 + WPM_STEP} WPM`)).toBeInTheDocument();
    expect(settingsStore.getSettings().wpm).toBe(300 + WPM_STEP);
  });

  it('provides a way back to the home page', () => {
    renderSettingsPage();

    expect(screen.getByRole('link', { name: /done/i })).toBeInTheDocument();
  });

  it('shows the current RSVP reading behavior and describes both modes', () => {
    renderSettingsPage();

    expect(screen.getByRole('radio', { name: /normal mode/i, checked: true })).toBeInTheDocument();
    expect(screen.getByText(/hide surrounding content and prevent scrolling/i)).toBeInTheDocument();
    expect(screen.getByText(/document scrollable while rsvp is playing/i)).toBeInTheDocument();
  });

  it('selecting Focus Mode updates and persists the reading behavior', () => {
    renderSettingsPage();

    fireEvent.click(screen.getByRole('radio', { name: /focus mode/i }));

    expect(screen.getByRole('radio', { name: /focus mode/i, checked: true })).toBeInTheDocument();
    expect(settingsStore.getSettings().readingBehavior).toBe('focus');
  });

  it('shows "Pause RSVP on scroll" checked by default', () => {
    renderSettingsPage();

    expect(screen.getByRole('checkbox', { name: /pause rsvp on scroll/i })).toBeChecked();
  });

  it('unchecking "Pause RSVP on scroll" updates and persists it', () => {
    renderSettingsPage();

    fireEvent.click(screen.getByRole('checkbox', { name: /pause rsvp on scroll/i }));

    expect(screen.getByRole('checkbox', { name: /pause rsvp on scroll/i })).not.toBeChecked();
    expect(settingsStore.getSettings().pauseOnScroll).toBe(false);
  });
});
