/**
 * Playwright global setup — warms each application's dev server before tests.
 *
 * Each test opens a fresh browser context, which triggers a cold compile on a
 * Next dev server. Warming one route per app (and the main Admin routes when
 * admin credentials are available) keeps first assertions from timing out.
 *
 * Origins come from the projects in this run, so a run limited to one app (or
 * pointed at a deployed environment) never touches the other servers.
 */
import { chromium, type FullConfig } from '@playwright/test';
import { E2E_APPS, type E2EApp } from './helpers/app-origins';

const ADMIN_ROUTES = ['/dashboard', '/applications', '/programs', '/analytics', '/users', '/settings'];

function originsInRun(config: FullConfig): Map<E2EApp, string> {
  const origins = new Map<E2EApp, string>();
  for (const project of config.projects) {
    const app = project.metadata?.app as E2EApp | undefined;
    const baseURL = project.use?.baseURL;
    if (app && baseURL && !origins.has(app)) origins.set(app, baseURL);
  }
  return origins;
}

async function reachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(180_000) });
    return response.status < 500;
  } catch {
    return false;
  }
}

function isLocal(origin: string): boolean {
  const { hostname } = new URL(origin);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

async function warmAdmin(origin: string) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('[global-setup] TEST_ADMIN_EMAIL/PASSWORD not set — skipping authenticated Admin warm-up');
    return;
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${origin}/login`, { timeout: 60_000 });
    await page.waitForSelector('input[type="email"]', { timeout: 30_000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });
    process.stdout.write(`[global-setup] admin login landed at: ${page.url()}\n`);

    for (const route of ADMIN_ROUTES) {
      process.stdout.write(`[global-setup] warming admin ${route}...\n`);
      await page.goto(`${origin}${route}`, { timeout: 120_000 }).catch(() => {});
      await page.waitForSelector('h1, h2, nav, main', { timeout: 45_000 }).catch(() => {});
    }
  } catch (error) {
    // Warm-up is an optimisation; specs report real authentication failures.
    console.warn(`[global-setup] admin warm-up failed: ${error instanceof Error ? error.message : error}`);
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig) {
  for (const [app, origin] of originsInRun(config)) {
    if (!isLocal(origin)) continue; // Deployed environments are already compiled.
    const url = `${origin}${E2E_APPS[app].readyPath}`;
    if (!(await reachable(url))) {
      console.warn(`[global-setup] ${app} is not reachable at ${origin} — skipping its warm-up`);
      continue;
    }
    process.stdout.write(`[global-setup] ${app} ready at ${origin}\n`);
    if (app === 'admin') await warmAdmin(origin);
  }
}
