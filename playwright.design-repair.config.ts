import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'platform-design-repair.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'artifacts/design-repair/browser-results.json' }]],
  use: {
    baseURL: process.env.DESIGN_REPAIR_BASE_URL || 'http://127.0.0.1:36871',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  ...(process.env.DESIGN_REPAIR_BASE_URL ? {} : { webServer: {
    command: 'pnpm --filter @elevate/marketing exec next dev --hostname 127.0.0.1 --port 36871',
    url: 'http://127.0.0.1:36871',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  } }),
  projects: [320, 375, 390, 768, 1024, 1440].map(width => ({
    name: `${width}px`, use: { viewport: { width, height: 900 } },
  })),
});
