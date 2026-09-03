import { defineConfig, devices } from '@playwright/test';

const isRemote = !!(
  process.env.PLAYWRIGHT_BASE_URL &&
  !process.env.PLAYWRIGHT_BASE_URL.includes('localhost')
);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    // Only smoke tests in CI - fast, reliable checks
    'live-smoke.spec.ts',
    'config-leaks.spec.ts',
  ],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://www.elevateforhumanity.org',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
  ],
  // Skip dev server for remote URLs
  ...(isRemote
    ? {}
    : {
        webServer: {
          command: 'pnpm next dev --turbopack',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 180000,
        },
      }),
});
