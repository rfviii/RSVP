import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PDF = path.resolve(__dirname, '../src/tests/fixtures/sample.pdf');

// Kept on a Chromium-based device (per spec: "Use Playwright with Chromium")
// regardless of which project runs this file.
test.use({ ...devices['Pixel 7'] });

test.describe('mobile viewport', () => {
  test('reads a document with no horizontal overflow and touch-sized controls', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Import PDF').setInputFiles(SAMPLE_PDF);
    await page.waitForURL(/\/reader\//);
    await expect(page.getByText('Hello')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const playButton = page.getByRole('button', { name: 'Play' });
    const box = await playButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await playButton.click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });
});
