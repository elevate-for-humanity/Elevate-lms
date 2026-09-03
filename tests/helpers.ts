import { Page } from '@playwright/test';

export async function gotoWithRetry(page: Page, url: string, retries = 2): Promise<void> {
  for (let i = 0; i <= retries; i++) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      return;
    } catch (error) {
      if (i === retries) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  return page.locator(selector).first().waitFor({ state: 'visible', timeout });
}

export function hasTestCredentials(): boolean {
  return !!(process.env.TEST_STUDENT_EMAIL && process.env.TEST_STUDENT_PASSWORD);
}

export async function loginAsStudent(page: Page): Promise<boolean> {
  const email = process.env.TEST_STUDENT_EMAIL;
  const password = process.env.TEST_STUDENT_PASSWORD;

  if (!email || !password) {
    return false;
  }

  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  await page.waitForURL(/\/(lms|dashboard|home)/, { timeout: 15000 }).catch(() => {});

  return true;
}
