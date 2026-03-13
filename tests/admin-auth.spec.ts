/**
 * Admin namespace auth regression
 *
 * Verifies that all /admin/* routes and /api/admin/* endpoints are protected
 * at the request layer. If any route becomes anonymously accessible, these
 * tests fail and block the build.
 *
 * Run: pnpm test:e2e tests/admin-auth.spec.ts
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Representative sample covering: operational, compliance, system, finance, and nested routes.
// Extend this list when new admin routes are added.
const ADMIN_PAGE_ROUTES = [
  '/admin/dashboard',
  '/admin/students',
  '/admin/partners',
  '/admin/documents',
  '/admin/reports/enrollment',
  '/admin/certificates',
  '/admin/completions',
  '/admin/wioa',
  '/admin/tax-filing',
  '/admin/settings',
  '/admin/api-keys',
  '/admin/security',
];

const ADMIN_API_ROUTES = [
  '/api/admin/students',
  '/api/admin/programs',
  '/api/admin/enrollments',
];

test.describe('Admin namespace — anonymous access blocked', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('admin page routes redirect unauthenticated requests to login', async ({ page }) => {
    const failures: string[] = [];

    for (const route of ADMIN_PAGE_ROUTES) {
      await page.goto(`${baseURL}${route}`, { waitUntil: 'commit' });
      const finalUrl = page.url();

      const blocked =
        finalUrl.includes('/login') ||
        finalUrl.includes('/unauthorized') ||
        finalUrl.includes('/admin-login');

      if (!blocked) {
        failures.push(`${route} → landed at ${finalUrl}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Admin routes accessible without auth:\n${failures.map((f) => `  ${f}`).join('\n')}`
      );
    }
  });

  test('admin API routes return 401 or 403 for anonymous requests', async ({ request }) => {
    const failures: string[] = [];

    for (const route of ADMIN_API_ROUTES) {
      const response = await request.get(`${baseURL}${route}`);
      const status = response.status();

      if (status !== 401 && status !== 403) {
        failures.push(`${route} → ${status}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Admin API routes accessible without auth:\n${failures.map((f) => `  ${f}`).join('\n')}`
      );
    }
  });
});
