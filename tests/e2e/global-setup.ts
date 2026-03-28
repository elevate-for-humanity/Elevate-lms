/**
 * Playwright global setup — warms all admin routes before tests run.
 * Each test opens a fresh browser context which triggers a cold compile.
 * Pre-warming ensures the dev server has compiled all routes before assertions run.
 */
import { chromium } from '@playwright/test'

export default async function globalSetup() {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD
  if (!email || !password) {
    console.warn('[global-setup] TEST_ADMIN_EMAIL/PASSWORD not set — skipping warm-up')
    return
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  try {
    await page.goto('http://localhost:3000/login', { timeout: 30000 })
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    // Wait for navigation away from /login — then check where we landed
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
    const landed = page.url()
    process.stdout.write(`[global-setup] landed at: ${landed}\n`)
    if (!landed.includes('/admin')) {
      // Navigate directly — login succeeded but redirect went elsewhere
      await page.goto('http://localhost:3000/admin/dashboard', { timeout: 30000 })
    }

    const routes = [
      '/admin/dashboard',
      '/admin/applications',
      '/admin/programs',
      '/admin/analytics',
      '/admin/users',
      '/admin/settings',
    ]

    for (const route of routes) {
      process.stdout.write(`[global-setup] warming ${route}...\n`)
      await page.goto(`http://localhost:3000${route}`, { timeout: 60000 })
      // Wait for any visible content — confirms compile completed
      await page.waitForSelector('h1, h2, nav, main', { timeout: 45000 }).catch(() => {})
      // Extra wait for client hydration
      await page.waitForTimeout(3000)
      const text = (await page.locator('body').innerText()).slice(0, 60).replace(/\n/g, ' ')
      process.stdout.write(`[global-setup]   -> ${text}\n`)
    }

    process.stdout.write('[global-setup] all routes warm\n')
  } finally {
    await browser.close()
  }
}
