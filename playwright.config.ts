import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  // Browser E2E only. Node/DB integration tests run via dedicated scripts.
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/unit/**', '**/live-smoke.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
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
        launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      },
    },
  ],
  // Use PLAYWRIGHT_BASE_URL to target a remote environment.
  // Default: always test against localhost:3000.
  ...(!process.env.PLAYWRIGHT_BASE_URL || process.env.PLAYWRIGHT_BASE_URL.includes('localhost')
    ? {
        webServer: {
          // Avoid predev hooks in CI: run Next dev server directly.
          command: 'pnpm next dev --turbopack',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 180000,
        },
      }
    : {}),
});
