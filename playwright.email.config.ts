import { defineConfig, devices } from '@playwright/test';

// Component/browser coverage uses synthetic API responses. It does not certify
// authentication, mailbox authorization, provider delivery, or installed OS UI.
export default defineConfig({
  testDir: './tests/browser/email-workspace',
  testMatch: '*.spec.ts',
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-email-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'ipad-webkit', use: { ...devices['iPad Pro 11'], browserName: 'webkit' } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'android-chromium', use: { ...devices['Pixel 7'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } } },
  ],
  webServer: {
    command: 'pnpm exec vite --config tests/browser/email-workspace/vite.config.ts',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: !process.env.CI,
  },
});
