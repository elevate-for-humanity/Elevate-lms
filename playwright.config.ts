import path from 'node:path';
import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';
import {
  E2E_APPS,
  appOrigin,
  selectedApps,
  usesLocalDevServer,
  type E2EApp,
} from './tests/e2e/helpers/app-origins';

/**
 * Monorepo browser E2E.
 *
 * Every spec belongs to exactly one application. Each device project (e.g.
 * `desktop-chrome`) is emitted once per application with that application's
 * origin as `baseURL`, so `--project=desktop-chrome` runs Marketing, Admin and
 * LMS specs against the right server. Project names are deliberately shared
 * across apps so existing `--project=<device>` invocations keep working.
 *
 * Local ports: marketing :3000, admin :3001, lms :3002. Override an origin with
 * PLAYWRIGHT_MARKETING_URL / PLAYWRIGHT_ADMIN_URL / PLAYWRIGHT_LMS_URL, or all
 * of them with PLAYWRIGHT_BASE_URL. Limit a run with PLAYWRIGHT_APPS=admin,lms.
 */
const SPECS: Record<E2EApp, string[]> = {
  marketing: [
    'accessibility.spec.ts',
    'application-flow.spec.ts',
    'canonical-application-flow.spec.ts',
    'complete-platform.spec.ts',
    'config-leaks.spec.ts',
    'critical-flows.spec.ts',
    'critical-user-journeys.spec.ts',
    'design-audit-public-pages.spec.ts',
    'enrollment-flow.spec.ts',
    'full-enrollment-journey.spec.ts',
    'home-config-leaks.spec.ts',
    'homepage-mobile-curation.spec.ts',
    'homepage-responsive.spec.ts',
    'hvac-hero-playback.spec.ts',
    'platform-design-repair.spec.ts',
    'program-e2e-flows.spec.ts',
    'public-site.spec.ts',
  ],
  admin: [
    'admin-portal-proof.spec.ts',
    'admin-portal.spec.ts',
    'course-builder.spec.ts',
    'lizzy-container.spec.ts',
  ],
  lms: [
    'employer-onboarding.spec.ts',
    'enrollment-lifecycle.spec.ts',
    'hvac-live-lesson-playback.spec.ts',
    'jordan-magic-link.spec.ts',
    'portal-responsive-design.spec.ts',
    'program-holder-unauth-redirect.spec.ts',
    'program-holder.spec.ts',
    'registered-apprenticeship-authenticated.spec.ts',
    'student-career-resume.spec.ts',
    'student-login-flow.spec.ts',
    'student-portal.spec.ts',
  ],
};

// Production acceptance specs with hard-coded production origins. They run only
// when a workflow explicitly targets a deployed environment.
const LIVE_ONLY_SPECS = ['public-runtime-acceptance.spec.ts'];
const targetsDeployedEnvironment = /^https:\/\//.test(process.env.PLAYWRIGHT_BASE_URL?.trim() ?? '');
if (targetsDeployedEnvironment) SPECS.marketing.push(...LIVE_ONLY_SPECS);

const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };

const DEVICES: Project[] = [
  {
    name: 'desktop-chrome',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions },
  },
  {
    name: 'laptop-chrome',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, launchOptions },
  },
  {
    name: 'tablet-chrome',
    use: { ...devices['iPad Pro 11'], browserName: 'chromium', launchOptions },
  },
  {
    name: 'iphone-webkit',
    use: { ...devices['iPhone 13'], browserName: 'webkit' },
  },
  {
    name: 'android-chrome',
    use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions },
  },
];

const apps = selectedApps();

const projects: Project[] = apps.flatMap((app) =>
  DEVICES.map((device) => ({
    ...device,
    testMatch: SPECS[app].map((spec) => `**/${spec}`),
    metadata: { app },
    use: { ...device.use, baseURL: appOrigin(app) },
  })),
);

// Specs that also call a peer app's local origin (cross-app redirects/APIs).
const PEER_APPS: Record<string, E2EApp[]> = {
  'program-e2e-flows.spec.ts': ['lms'],
  'portal-responsive-design.spec.ts': ['admin', 'marketing'],
  'registered-apprenticeship-authenticated.spec.ts': ['admin'],
};

// CLI file filters (e.g. `playwright test tests/e2e/admin-portal.spec.ts`) only
// need the servers that own those specs. Projects must not depend on argv —
// workers re-load this config with different arguments — but webServer is
// evaluated in the runner process only.
function appsRequestedByCli(): Set<E2EApp> {
  const fileFilters = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('-') && /\.spec(\.ts)?$|\/|\\/.test(arg))
    .map((arg) => path.basename(arg).replace(/:\d+(:\d+)?$/, ''));
  if (!fileFilters.length) return new Set(apps);
  const matches = (spec: string) => fileFilters.some((filter) => spec.includes(filter));
  const needed = new Set<E2EApp>(apps.filter((app) => SPECS[app].some(matches)));
  for (const [spec, peers] of Object.entries(PEER_APPS)) {
    if (matches(spec)) peers.forEach((peer) => needed.add(peer));
  }
  return new Set(apps.filter((app) => needed.has(app)));
}

const crossAppEnv = {
  NEXT_PUBLIC_SITE_URL: appOrigin('marketing'),
  NEXT_PUBLIC_MARKETING_URL: appOrigin('marketing'),
  NEXT_PUBLIC_ADMIN_URL: appOrigin('admin'),
  NEXT_PUBLIC_LMS_URL: appOrigin('lms'),
  NEXT_PUBLIC_APP_URL: appOrigin('lms'),
  NEXT_TELEMETRY_DISABLED: '1',
};

const requested = appsRequestedByCli();
const webServer: PlaywrightTestConfig['webServer'] = apps
  .filter((app) => usesLocalDevServer(app) && requested.has(app))
  .map((app) => ({
    // Run the workspace's own dev script (and predev asset sync) on its port.
    command: `pnpm --filter ${E2E_APPS[app].workspace} dev --port ${E2E_APPS[app].port}`,
    url: `${appOrigin(app)}${E2E_APPS[app].readyPath}`,
    env: { ...crossAppEnv, PORT: String(E2E_APPS[app].port) },
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  }));

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  // Browser E2E only. Node/DB integration tests run via dedicated scripts.
  testIgnore: ['**/unit/**', '**/helpers/**', '**/live-smoke.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 30000,
  },
  projects,
  ...(webServer.length ? { webServer } : {}),
});
