import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the Vite dev server (not the production build): the PWA
 * service worker is prod-only and irrelevant to the flows under test here,
 * and the dev server starts faster and always reflects the current source.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
