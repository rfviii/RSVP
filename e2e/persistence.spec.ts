import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PDF = path.resolve(__dirname, '../src/tests/fixtures/sample.pdf');

test.describe('persistence', () => {
  test('reading progress survives a reload', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Import PDF').setInputFiles(SAMPLE_PDF);
    await page.waitForURL(/\/reader\//);

    const currentToken = page.getByTestId('current-token');
    await page.getByRole('button', { name: 'Next token' }).click();
    await expect(currentToken).toHaveText('World');

    await page.reload();

    // Verifies the reload actually resumed at "World" rather than just
    // rendering it as unread/surrounding text, which the hybrid reader
    // would do regardless of the resumed position.
    await expect(page.getByTestId('current-token')).toHaveText('World');
    await expect(page.getByText('Page 1 / 1')).toBeVisible();
  });

  test('an imported document appears in the library, can be reopened, and can be deleted', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Import PDF').setInputFiles(SAMPLE_PDF);
    await page.waitForURL(/\/reader\//);

    await page.getByRole('link', { name: /sample\.pdf/ }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: /sample\.pdf/i })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete sample\.pdf/i }).click();

    await expect(page.getByText(/import a pdf to start reading/i)).toBeVisible();
  });
});
