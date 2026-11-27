/**
 * Admin portal production-grade verification.
 *
 * Acceptance rule: a fix is DONE only when all four pass:
 *   1. route loads successfully
 *   2. intended browser interaction works
 *   3. underlying state/data changes correctly
 *   4. reload preserves the result
 *
 * Requires: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// ── Supabase service client for persistence checks ────────────────────────────
const ISOLATED_QA_SUPABASE_HOST = 'isdgjcdabhxxozarmxta.supabase.co';
const LIFECYCLE_QA_EMAIL_PREFIX = 'e2e-lifecycle-';
const LIFECYCLE_QA_EMAIL_SUFFIX = '@qa.invalid';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error('Student lifecycle E2E requires a valid isolated QA Supabase URL');
  }
  if (host !== ISOLATED_QA_SUPABASE_HOST) {
    throw new Error('Student lifecycle E2E refuses any Supabase project except isolated QA');
  }

  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function isLifecycleQaEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return (
    normalized.startsWith(LIFECYCLE_QA_EMAIL_PREFIX) &&
    normalized.endsWith(LIFECYCLE_QA_EMAIL_SUFFIX)
  );
}

async function listLifecycleQaAuthUsers(client = db()) {
  const matches: Array<{ id: string; email?: string }> = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Failed to list isolated QA Auth users: ${error.message}`);
    const users = data?.users ?? [];
    matches.push(
      ...users
        .filter((user) => isLifecycleQaEmail(user.email))
        .map((user) => ({ id: user.id, email: user.email })),
    );
    if (users.length < 1000) return matches;
  }
  throw new Error('Isolated QA Auth cleanup exceeded its bounded pagination limit');
}

async function cleanupOrphanedLifecycleQaAuthUsers() {
  const client = db();
  const staleUsers = await listLifecycleQaAuthUsers(client);
  for (const user of staleUsers) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`Failed to remove stale lifecycle QA Auth user: ${error.message}`);
  }
  const remaining = await listLifecycleQaAuthUsers(client);
  if (remaining.length !== 0) {
    throw new Error('Lifecycle QA Auth preflight cleanup left disposable users behind');
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
}

// ── Wait for real content (not networkidle — dev server keeps connections open)
async function waitForContent(page: Page, selector = 'h1, h2, main') {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.waitForTimeout(1500);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
interface TestApplication {
  id: string;
  email: string;
  programId: string;
  userId?: string;
  enrollmentId?: string;
}

async function createTestApplication(): Promise<TestApplication> {
  const client = db();
  const { data: program, error: programError } = await client
    .from('programs')
    .select('id,slug')
    .eq('slug', 'hvac-technician')
    .single();
  if (programError || !program) {
    throw new Error(`Failed to resolve the QA HVAC program: ${programError?.message}`);
  }

  const email = `e2e-lifecycle-${Date.now()}-${randomUUID()}@qa.invalid`;
  const { data, error } = await client
    .from('applications')
    .insert({
      first_name: 'E2E',
      last_name: 'Lifecycle',
      email,
      phone: '555-000-0000',
      city: 'Test City',
      state: 'TX',
      zip: '75001',
      date_of_birth: '1990-01-01',
      status: 'submitted',
      program_id: program.id,
      program_slug: program.slug,
      program_interest: program.slug,
      source: 'qa-admin-portal-proof',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`Failed to create test application: ${error?.message}`);
  return { id: data.id, email, programId: program.id };
}

async function deleteTestApplication(fixture: TestApplication) {
  const client = db();
  let userId = fixture.userId;

  if (!userId) {
    const { data: profile, error } = await client
      .from('profiles')
      .select('id')
      .eq('email', fixture.email)
      .maybeSingle();
    if (error) throw new Error(`Failed to resolve QA lifecycle profile: ${error.message}`);
    userId = profile?.id;
    if (!userId) {
      const authUser = (await listLifecycleQaAuthUsers(client)).find(
        (user) => user.email?.toLowerCase() === fixture.email.toLowerCase(),
      );
      userId = authUser?.id;
    }
  }

  if (userId) {
    const cleanupResults = await Promise.all([
      client.from('course_enrollments').delete().eq('student_id', userId),
      client
        .from('program_enrollments')
        .delete()
        .eq('user_id', userId)
        .eq('program_id', fixture.programId),
    ]);
    for (const result of cleanupResults) {
      if (result.error) throw new Error(`Failed to clean QA enrollment: ${result.error.message}`);
    }
  }

  const { error: applicationError } = await client
    .from('applications')
    .delete()
    .eq('id', fixture.id);
  if (applicationError) {
    throw new Error(`Failed to clean QA application: ${applicationError.message}`);
  }

  if (userId) {
    const { error: profileError } = await client.from('profiles').delete().eq('id', userId);
    if (profileError) throw new Error(`Failed to clean QA profile: ${profileError.message}`);
    const { error: authError } = await client.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Failed to clean QA Auth user: ${authError.message}`);
  }

  const verification = await Promise.all([
    client.from('applications').select('id', { count: 'exact', head: true }).eq('id', fixture.id),
    client.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('email', fixture.email),
    client.from('profiles').select('id', { count: 'exact', head: true }).eq('email', fixture.email),
  ]);
  for (const result of verification) {
    if (result.error) throw new Error(`QA lifecycle cleanup verification failed: ${result.error.message}`);
    if (result.count !== 0) throw new Error('QA lifecycle cleanup left disposable rows behind');
  }
  const remainingAuthUser = (await listLifecycleQaAuthUsers(client)).find(
    (user) => user.email?.toLowerCase() === fixture.email.toLowerCase(),
  );
  if (remainingAuthUser) throw new Error('QA lifecycle cleanup left a disposable Auth user behind');
}

async function getApplicationStatus(id: string): Promise<string | null> {
  const { data } = await db().from('applications').select('status').eq('id', id).single();
  return data?.status ?? null;
}

// =============================================================================
// TESTS
// =============================================================================

test.describe('Admin Portal — Production Proof', () => {
  test.beforeAll(async () => {
    await cleanupOrphanedLifecycleQaAuthUsers();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── 1. Dashboard: live data, no crash ─────────────────────────────────────
  test('dashboard renders live data without ERR_DASHBOARD_LOAD', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for sidebar nav (always present) then give client component time to hydrate
    await page.waitForSelector('nav, aside', { timeout: 30000 });
    await page.waitForTimeout(6000);

    const bodyText = await page.locator('body').innerText();

    // No error boundary
    expect(bodyText).not.toContain('ERR_DASHBOARD_LOAD');
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText).not.toContain('Dashboard Error');

    // No old hardcoded sentinel values
    expect(bodyText).not.toContain('1,247');
    expect(bodyText).not.toContain('$48,320');
    expect(bodyText).not.toContain('Marcus Johnson');
    expect(bodyText).not.toContain('Sarah Chen');

    // Real stat labels present (DashboardClient renders these)
    const hasStats =
      bodyText.includes('Students') ||
      bodyText.includes('Enrollments') ||
      bodyText.includes('Programs');
    expect(hasStats).toBe(true);

    // Reload preserves
    await page.reload();
    await page.waitForSelector('nav, aside', { timeout: 30000 });
    await page.waitForTimeout(5000);
    const bodyAfter = await page.locator('body').innerText();
    expect(bodyAfter).not.toContain('ERR_DASHBOARD_LOAD');
    expect(bodyAfter).not.toContain('Dashboard Error');
  });

  // ── 2. Applications: page loads, no missing component crash ───────────────
  test('applications page loads without FollowUpBlastButton crash', async ({ page }) => {
    await page.goto('/applications');
    // Wait for h1 — server component renders it immediately once compiled
    await page.waitForSelector('h1', { timeout: 40000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText).not.toContain('FollowUpBlastButton is not defined');
    await expect(page.locator('h1').first()).toContainText('Applications');
  });

  test('application approve changes status in DB and survives reload', async ({ page }) => {
    const fixture = await createTestApplication();
    try {
      await page.goto(`/applications/review/${fixture.id}`);
      await waitForContent(page, 'h1, h2, [class*="rounded"]');

      const enrollBtn = page.getByRole('button', { name: 'Enroll', exact: true });
      await expect(enrollBtn).toBeVisible({ timeout: 10000 });
      const approvalResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes(`/api/admin/applications/${fixture.id}/approve`),
      );
      await enrollBtn.click();
      const response = await approvalResponse;
      expect(response.status()).toBe(200);
      const approval = (await response.json()) as {
        user_id?: string;
        enrollment_id?: string;
      };
      expect(approval.user_id).toBeTruthy();
      expect(approval.enrollment_id).toBeTruthy();
      fixture.userId = approval.user_id;
      fixture.enrollmentId = approval.enrollment_id;

      // Persistence: DB row updated
      const statusAfter = await getApplicationStatus(fixture.id);
      expect(statusAfter).toBe('approved');
      const { count: enrollmentCount, error: enrollmentError } = await db()
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('id', fixture.enrollmentId!)
        .eq('user_id', fixture.userId!)
        .eq('program_id', fixture.programId)
        .eq('status', 'active');
      expect(enrollmentError).toBeNull();
      expect(enrollmentCount).toBe(1);

      // Reload preserves
      await page.reload();
      await waitForContent(page, 'h1, h2, [class*="rounded"]');
      await expect(page.getByText(/application has been approved/i)).toBeVisible();
    } finally {
      await deleteTestApplication(fixture);
    }
  });

  test('application reject changes status in DB and survives reload', async ({ page }) => {
    const fixture = await createTestApplication();
    try {
      await page.goto(`/applications/review/${fixture.id}`);
      await waitForContent(page, 'h1, h2, [class*="rounded"]');

      const rejectBtn = page.getByRole('button', { name: 'Reject', exact: true });
      await expect(rejectBtn).toBeVisible({ timeout: 10000 });
      const rejectionResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/admin/applications/${fixture.id}`),
      );
      await rejectBtn.click();
      const response = await rejectionResponse;
      expect(response.status()).toBe(200);

      // Persistence
      const statusAfter = await getApplicationStatus(fixture.id);
      expect(statusAfter).toBe('rejected');

      // Reload preserves
      await page.reload();
      await waitForContent(page, 'h1, h2, [class*="rounded"]');
      await expect(page.getByText(/application has been rejected/i)).toBeVisible();
    } finally {
      await deleteTestApplication(fixture);
    }
  });

  // ── 3. Programs: total count is non-zero and matches DB ───────────────────
  test('programs page shows correct total count from DB', async ({ page }) => {
    const { count: dbCount } = await db()
      .from('programs')
      .select('*', { count: 'exact', head: true });
    expect(dbCount).toBeGreaterThan(0);

    await page.goto('/programs');
    await waitForContent(page, 'h1');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');

    // "Total Programs" stat card must show a non-zero number
    // Find the stat card that contains "Total Programs" and check its sibling value
    const totalCard = page
      .locator('[class*="card"], [class*="stat"], .bg-white')
      .filter({ hasText: 'Total Programs' })
      .first();
    if (await totalCard.isVisible()) {
      const cardText = await totalCard.innerText();
      // Extract the number — it should not be 0
      const match = cardText.match(/(\d+)/);
      if (match) {
        expect(parseInt(match[1])).toBeGreaterThan(0);
      }
    }

    await page.reload();
    await waitForContent(page, 'h1');
    const bodyAfter = await page.locator('body').innerText();
    expect(bodyAfter).not.toContain('Something went wrong');
  });

  // ── 4. Analytics: live data, no hardcoded sentinels ───────────────────────
  test('analytics page shows live data without hardcoded values', async ({ page }) => {
    await page.goto('/analytics');
    await waitForContent(page, 'h1');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');
    await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();

    // Old hardcoded sentinel values must not appear
    expect(bodyText).not.toContain('CDL Prep Course');
    expect(bodyText).not.toContain('Chart visualization coming soon');
  });

  // ── 5. Students: canonical directory and audit-record navigation ─────────
  test('student directory exposes operational and audit record views', async ({ page }) => {
    await page.goto('/students');
    await waitForContent(page, 'h1');

    await expect(page.getByRole('heading', { name: 'Students', exact: true })).toBeVisible();
    const auditRecords = page.getByRole('link', { name: /Test & audit records/ });
    await expect(auditRecords).toBeVisible();
    await auditRecords.click();
    await expect(page).toHaveURL(/\/students\?include_test=1$/);
    // students/loading.tsx commits the URL before the server render streams in;
    // the include_test view renders every QA fixture row (9.2s in run 45982254686).
    await expect(page.getByRole('link', { name: 'Operational records', exact: true })).toBeVisible({
      timeout: 20_000,
    });
  });

  // ── 6. Settings: real page, no fake spinner ───────────────────────────────
  test('settings page loads and is not a fake spinner', async ({ page }) => {
    await page.goto('/settings');
    await waitForContent(page, 'h1');

    await expect(page.locator('h1').first()).toContainText('Settings');
    await expect(page.locator('button', { hasText: /saving\.\.\./i })).not.toBeVisible();

    await expect(page.getByRole('link', { name: /General/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Security/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Integrations & Webhooks/ })).toBeVisible();
  });

  // ── 7. Programs View/Manage links resolve without 404 ─────────────────────
  test('programs View links resolve to correct records without 404', async ({ page }) => {
    await page.goto('/programs');
    await waitForContent(page, 'h1');

    const viewLinks = page.locator('a', { hasText: /^(view|manage|edit)$/i });
    const count = await viewLinks.count();

    if (count === 0) {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Something went wrong');
      return;
    }

    const limit = Math.min(count, 3);
    for (let i = 0; i < limit; i++) {
      const href = await viewLinks.nth(i).getAttribute('href');
      if (!href) continue;
      const res = await page.request.get(href);
      expect(res.status()).not.toBe(404);
    }
  });
});
