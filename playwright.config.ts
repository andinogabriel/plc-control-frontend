import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E smoke test config. Builds the app and serves the static build with `vite preview` (more
 * production-like and avoids dev-server module-transform flakiness). Port 4173 so it never clashes
 * with the dev server on 5173. The API is mocked inside the tests (page.route), so no backend is
 * needed and the run is deterministic.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
