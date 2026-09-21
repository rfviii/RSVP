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
});
