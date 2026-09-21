import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      workbox: {
        // Explicitly includes .mjs so pdf.js's worker is precached too: importing a
        // PDF is a core feature, not just the app shell, so it should work offline.
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'RSVP Reader',
        short_name: 'RSVP Reader',
        description:
          'A distraction-free RSVP speed-reading app for PDFs. Documents are processed entirely on your device.',
        theme_color: '#0369a1',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/helpers/setupTests.ts'],
    css: true,
    // Playwright's e2e/ specs use a different test runner API; keep Vitest out of that directory.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
