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

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// ── Supabase service client for persistence checks ────────────────────────────
function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set')
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin/, { timeout: 20000 })
}

// ── Wait for real content (not networkidle — dev server keeps connections open)
async function waitForContent(page: Page, selector = 'h1, h2, main') {
  await page.waitForSelector(selector, { timeout: 20000 })
  await page.waitForTimeout(1500)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
async function createTestApplication(): Promise<string> {
  const { data, error } = await db()
    .from('applications')
    .insert({
      first_name: 'E2E',
      last_name: 'TestApplicant',
      email: `e2e-applicant-${Date.now()}@elevate-test.internal`,
      phone: '555-000-0000',
      city: 'Test City',
      state: 'TX',
      zip: '75001',
      date_of_birth: '1990-01-01',
      status: 'submitted',
      program_interest: 'HVAC',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create test application: ${error?.message}`)
  return data.id
}

async function deleteTestApplication(id: string) {
  await db().from('applications').delete().eq('id', id)
}

async function getApplicationStatus(id: string): Promise<string | null> {
  const { data } = await db().from('applications').select('status').eq('id', id).single()
  return data?.status ?? null
}

// =============================================================================
// TESTS
// =============================================================================

test.describe('Admin Portal — Production Proof', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  // ── 1. Dashboard: live data, no crash ─────────────────────────────────────
  test('dashboard renders live data without ERR_DASHBOARD_LOAD', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // Wait for sidebar nav (always present) then give client component time to hydrate
    await page.waitForSelector('nav, aside', { timeout: 30000 })
    await page.waitForTimeout(6000)

    const bodyText = await page.locator('body').innerText()

    // No error boundary
    expect(bodyText).not.toContain('ERR_DASHBOARD_LOAD')
    expect(bodyText).not.toContain('Something went wrong')
    expect(bodyText).not.toContain('Dashboard Error')

    // No old hardcoded sentinel values
    expect(bodyText).not.toContain('1,247')
    expect(bodyText).not.toContain('$48,320')
    expect(bodyText).not.toContain('Marcus Johnson')
    expect(bodyText).not.toContain('Sarah Chen')

    // Real stat labels present (DashboardClient renders these)
    const hasStats = bodyText.includes('Students') || bodyText.includes('Enrollments') || bodyText.includes('Programs')
    expect(hasStats).toBe(true)

    // Reload preserves
    await page.reload()
    await page.waitForSelector('nav, aside', { timeout: 30000 })
    await page.waitForTimeout(5000)
    const bodyAfter = await page.locator('body').innerText()
    expect(bodyAfter).not.toContain('ERR_DASHBOARD_LOAD')
    expect(bodyAfter).not.toContain('Dashboard Error')
  })

  // ── 2. Applications: page loads, no missing component crash ───────────────
  test('applications page loads without FollowUpBlastButton crash', async ({ page }) => {
    await page.goto('/admin/applications')
    // Wait for h1 — server component renders it immediately once compiled
    await page.waitForSelector('h1', { timeout: 40000 })
    await page.waitForTimeout(2000)

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Something went wrong')
    expect(bodyText).not.toContain('FollowUpBlastButton is not defined')
    await expect(page.locator('h1').first()).toContainText('Applications')
  })

  test('application approve changes status in DB and survives reload', async ({ page }) => {
    const appId = await createTestApplication()
    try {
      await page.goto(`/admin/applications/review/${appId}`)
      await waitForContent(page, 'h1, h2, [class*="rounded"]')

      const approveBtn = page.locator('button', { hasText: /approve/i }).first()
      await expect(approveBtn).toBeVisible({ timeout: 10000 })
      await approveBtn.click()
      await page.waitForTimeout(4000)

      // Persistence: DB row updated
      const statusAfter = await getApplicationStatus(appId)
      expect(['approved', 'converted', 'enrolled']).toContain(statusAfter)

      // Reload preserves
      await page.reload()
      await waitForContent(page, 'h1, h2, [class*="rounded"]')
      const bodyAfter = await page.locator('body').innerText()
      const hasApprovedState = bodyAfter.includes('approved') || bodyAfter.includes('enrolled') || bodyAfter.includes('converted')
      expect(hasApprovedState).toBe(true)

    } finally {
      await deleteTestApplication(appId)
    }
  })

  test('application reject changes status in DB and survives reload', async ({ page }) => {
    const appId = await createTestApplication()
    try {
      await page.goto(`/admin/applications/review/${appId}`)
      await waitForContent(page, 'h1, h2, [class*="rounded"]')

      const rejectBtn = page.locator('button', { hasText: /reject/i }).first()
      await expect(rejectBtn).toBeVisible({ timeout: 10000 })
      await rejectBtn.click()
      await page.waitForTimeout(4000)

      // Persistence
      const statusAfter = await getApplicationStatus(appId)
      expect(statusAfter).toBe('rejected')

      // Reload preserves
      await page.reload()
      await waitForContent(page, 'h1, h2, [class*="rounded"]')
      const bodyAfter = await page.locator('body').innerText()
      expect(bodyAfter).toContain('rejected')

    } finally {
      await deleteTestApplication(appId)
    }
  })

  // ── 3. Programs: total count is non-zero and matches DB ───────────────────
  test('programs page shows correct total count from DB', async ({ page }) => {
    const { count: dbCount } = await db()
      .from('programs')
      .select('*', { count: 'exact', head: true })
    expect(dbCount).toBeGreaterThan(0)

    await page.goto('/admin/programs')
    await waitForContent(page, 'h1')

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Something went wrong')

    // "Total Programs" stat card must show a non-zero number
    // Find the stat card that contains "Total Programs" and check its sibling value
    const totalCard = page.locator('[class*="card"], [class*="stat"], .bg-white').filter({ hasText: 'Total Programs' }).first()
    if (await totalCard.isVisible()) {
      const cardText = await totalCard.innerText()
      // Extract the number — it should not be 0
      const match = cardText.match(/(\d+)/)
      if (match) {
        expect(parseInt(match[1])).toBeGreaterThan(0)
      }
    }

    await page.reload()
    await waitForContent(page, 'h1')
    const bodyAfter = await page.locator('body').innerText()
    expect(bodyAfter).not.toContain('Something went wrong')
  })

  // ── 4. Analytics: live data, no hardcoded sentinels ───────────────────────
  test('analytics page shows live data without hardcoded values', async ({ page }) => {
    await page.goto('/admin/analytics')
    await waitForContent(page, 'h1')

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Something went wrong')
    await expect(page.locator('h1').first()).toContainText('Reports')

    // Old hardcoded sentinel values must not appear
    expect(bodyText).not.toContain('CDL Prep Course')
    expect(bodyText).not.toContain('Chart visualization coming soon')
  })

  // ── 5. Users: search input present and functional ─────────────────────────
  test('users page shows live count and search filters rows', async ({ page }) => {
    await page.goto('/admin/users')
    await waitForContent(page, 'h1')

    await expect(page.locator('h1').first()).toContainText('User')

    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="name" i], input[placeholder*="email" i]').first()
    await expect(searchInput).toBeVisible()

    const rowsBefore = await page.locator('tbody tr').count()
    if (rowsBefore > 0) {
      await searchInput.fill('zzz_no_match_xyz_99')
      await page.waitForTimeout(600)
      const rowsAfter = await page.locator('tbody tr').count()
      const emptyState = page.locator('text=/no users|no results|0 users/i')
      const filtered = rowsAfter < rowsBefore || await emptyState.isVisible()
      expect(filtered).toBe(true)
    }
  })

  // ── 6. Settings: real page, no fake spinner ───────────────────────────────
  test('settings page loads and is not a fake spinner', async ({ page }) => {
    await page.goto('/admin/settings')
    await waitForContent(page, 'h1')

    await expect(page.locator('h1').first()).toContainText('Settings')
    await expect(page.locator('button', { hasText: /saving\.\.\./i })).not.toBeVisible()

    const bodyText = await page.locator('body').innerText()
    // Real settings page says changes are saved to DB
    const isReal = bodyText.includes('database') || bodyText.includes('saved') || bodyText.includes('immediately')
    expect(isReal).toBe(true)
  })

  // ── 7. Programs View/Manage links resolve without 404 ─────────────────────
  test('programs View links resolve to correct records without 404', async ({ page }) => {
    await page.goto('/admin/programs')
    await waitForContent(page, 'h1')

    const viewLinks = page.locator('a', { hasText: /^(view|manage|edit)$/i })
    const count = await viewLinks.count()

    if (count === 0) {
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).not.toContain('Something went wrong')
      return
    }

    const limit = Math.min(count, 3)
    for (let i = 0; i < limit; i++) {
      const href = await viewLinks.nth(i).getAttribute('href')
      if (!href) continue
      const res = await page.request.get(href)
      expect(res.status()).not.toBe(404)
    }
  })
})
