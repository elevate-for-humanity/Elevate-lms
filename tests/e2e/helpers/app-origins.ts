/**
 * Origins of the three monorepo applications under browser test.
 *
 * Shared by playwright.config.ts, global-setup and specs that need a second
 * origin (for example an LMS spec that also signs in to Admin).
 *
 * Resolution per app: PLAYWRIGHT_<APP>_URL → PLAYWRIGHT_BASE_URL (legacy
 * single-origin override used by live acceptance workflows) → local dev port.
 * Use appOrigin() for the app a spec tests and peerOrigin() for any other app
 * the spec visits.
 */
export type E2EApp = 'marketing' | 'admin' | 'lms';

export const E2E_APPS: Record<E2EApp, { workspace: string; port: number; envVar: string; readyPath: string }> = {
  marketing: { workspace: '@elevate/marketing', port: 3000, envVar: 'PLAYWRIGHT_MARKETING_URL', readyPath: '/' },
  admin: { workspace: '@elevate/admin', port: 3001, envVar: 'PLAYWRIGHT_ADMIN_URL', readyPath: '/login' },
  lms: { workspace: '@elevate/lms', port: 3002, envVar: 'PLAYWRIGHT_LMS_URL', readyPath: '/login' },
};

const PRODUCTION_ORIGINS: Record<E2EApp, string> = {
  marketing: 'https://www.elevateforhumanity.org',
  admin: 'https://admin.elevateforhumanity.org',
  lms: 'https://lms.elevateforhumanity.org',
};

export function localOrigin(app: E2EApp): string {
  return `http://localhost:${E2E_APPS[app].port}`;
}

/** True when the app has no override, so Playwright must start its dev server. */
export function usesLocalDevServer(app: E2EApp): boolean {
  return !process.env[E2E_APPS[app].envVar]?.trim() && !process.env.PLAYWRIGHT_BASE_URL?.trim();
}

export function appOrigin(app: E2EApp): string {
  const value =
    process.env[E2E_APPS[app].envVar]?.trim() || process.env.PLAYWRIGHT_BASE_URL?.trim() || localOrigin(app);
  return value.replace(/\/+$/, '');
}

/**
 * Origin of an app a spec visits besides the one it tests. A single legacy
 * PLAYWRIGHT_BASE_URL names only the primary app: a deployed base implies the
 * production peers, a local base implies the local dev ports.
 */
export function peerOrigin(app: E2EApp): string {
  const explicit = process.env[E2E_APPS[app].envVar]?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const base = process.env.PLAYWRIGHT_BASE_URL?.trim();
  return base && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base) ? PRODUCTION_ORIGINS[app] : localOrigin(app);
}

/** Apps selected for this run (PLAYWRIGHT_APPS=marketing,admin). Defaults to all. */
export function selectedApps(): E2EApp[] {
  const all = Object.keys(E2E_APPS) as E2EApp[];
  const requested = process.env.PLAYWRIGHT_APPS?.split(',').map((value) => value.trim()).filter(Boolean);
  if (!requested?.length) return all;
  const unknown = requested.filter((value) => !all.includes(value as E2EApp));
  if (unknown.length) throw new Error(`PLAYWRIGHT_APPS contains unknown app(s): ${unknown.join(', ')}`);
  return all.filter((app) => requested.includes(app));
}
