import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PDF = path.resolve(__dirname, '../src/tests/fixtures/sample.pdf');

test.describe('critical reading flow', () => {
  test('import a PDF, read it, pause/resume, change WPM, navigate, and restart', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'RSVP Reader' })).toBeVisible();

    // Import
    await page.getByLabel('Import PDF').setInputFiles(SAMPLE_PDF);

    // Process document -> lands in the reader. The hybrid reader shows
    // read/current/unread text simultaneously, so position checks target
    // the current-token element specifically, not just word presence.
    await page.waitForURL(/\/reader\//);
    const currentToken = page.getByTestId('current-token');
    await expect(currentToken).toHaveText('Hello');

    // Start playback
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(currentToken).toHaveText('World', { timeout: 2000 });

    // Pause
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByText('Paused')).toBeVisible();

    // Change WPM
    await expect(page.getByText('300 WPM')).toBeVisible();
    await page.getByRole('button', { name: 'Increase words per minute' }).click();
    await expect(page.getByText('325 WPM')).toBeVisible();

    // Navigate manually
    await page.getByRole('button', { name: 'Previous token' }).click();
    await expect(currentToken).toHaveText('Hello');
    // "World" was already read but must still be on screen, not hidden.
    await expect(page.getByText('World')).toBeVisible();
    await page.getByRole('button', { name: 'Next token' }).click();
    await expect(currentToken).toHaveText('World');

    // Restart
    await page.getByRole('button', { name: 'Restart from the beginning' }).click();
    await expect(currentToken).toHaveText('Hello');
    await expect(page.getByText('Page 1 / 1')).toBeVisible();
  });

  test('the Space shortcut still only toggles once when the Play/Pause button itself has focus', async ({
    page,
  }) => {
    // A real browser also treats Space as "activate the focused button" natively.
    // Without event.preventDefault() in the keydown handler, that native
    // activation and our own keyboard-shortcut handler would both fire for the
    // same keypress and cancel each other out. jsdom-based unit tests can't
    // catch this, since jsdom doesn't implement that native behavior.
    await page.goto('/');
    await page.getByLabel('Import PDF').setInputFiles(SAMPLE_PDF);
    await page.waitForURL(/\/reader\//);

    const playButton = page.getByRole('button', { name: 'Play' });
    await playButton.click(); // starts playback and focuses the button
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    await page.keyboard.press('Space');

    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 1000 });
    const currentToken = page.getByTestId('current-token');
    const tokenAfterPause = await currentToken.textContent();
    await page.waitForTimeout(1000);
    await expect(currentToken).toHaveText(tokenAfterPause!);
  });

  test('shows a clear error for a file that is not a PDF', async ({ page }) => {
    const notAPdf = path.resolve(__dirname, '../src/tests/fixtures/not-a-pdf.txt');

    await page.goto('/');
    await page.getByLabel('Import PDF').setInputFiles(notAPdf);

    await expect(page.getByRole('alert')).toContainText(/does not appear to be a pdf/i);
    // Stays on the home page rather than pretending the import succeeded.
    await expect(page).toHaveURL('/');
  });
});
