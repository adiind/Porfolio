import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Real-browser tests (npm run e2e). They run against the production build served by `vite preview`, and only there:
 * `npm run build` and `npm run check` also run in the site's deploy build, where no browser exists.
 * Vitest skips e2e/ (vite.config.ts) and this runner reads only e2e/, so neither runs the other's files.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  outputDir: 'e2e/results',
  fullyParallel: true,
  // four browsers at once: the CI runner's core count. More starve the software renderer and the preview server.
  workers: 4,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // a fresh build every run: vite preview serves dist/, and a stale dist/ would test old code
    command: `npx vite build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
