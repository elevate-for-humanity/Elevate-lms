import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const APPRENTICE_EMAIL = process.env.E2E_APPRENTICE_EMAIL || process.env.TEST_STUDENT_EMAIL || '';
const APPRENTICE_PASSWORD = process.env.E2E_APPRENTICE_PASSWORD || process.env.TEST_STUDENT_PASSWORD || '';
const HOST_EMAIL = process.env.E2E_HOST_SHOP_EMAIL || '';
const HOST_PASSWORD = process.env.E2E_HOST_SHOP_PASSWORD || '';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
}

test.describe('Registered apprenticeship authorization', () => {
  test.skip(!APPRENTICE_EMAIL || !APPRENTICE_PASSWORD, 'Authenticated apprentice credentials are required');

  test('apprentice can reach canonical apprentice and RTI surfaces but cannot use Host Shop verifier API', async ({ page }) => {
    await login(page, APPRENTICE_EMAIL, APPRENTICE_PASSWORD);

    const dashboard = await page.goto(`${BASE}/apprentice`, { waitUntil: 'domcontentloaded' });
    expect(dashboard?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');
    await expect(page.locator('body')).toContainText(/apprentice|registered|competenc|RTI/i);

    const rti = await page.goto(`${BASE}/apprentice/rti`, { waitUntil: 'domcontentloaded' });
    expect(rti?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');

    const forbidden = await page.request.patch(`${BASE}/api/host-shop/competencies`, {
      data: { enrollmentId: '00000000-0000-0000-0000-000000000000', competencyId: 'not-authorized', completed: true },
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(forbidden.status());
  });
});

test.describe('Host Shop reversible competency persistence', () => {
  test.skip(!HOST_EMAIL || !HOST_PASSWORD, 'Authenticated Host Shop credentials are required');

  test('assigned Host Shop verifier can persist a competency change and restore the original state', async ({ page }) => {
    await login(page, HOST_EMAIL, HOST_PASSWORD);

    const dashboard = await page.goto(`${BASE}/host-shop/dashboard`, { waitUntil: 'domcontentloaded' });
    expect(dashboard?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');

    const listResponse = await page.request.get(`${BASE}/api/host-shop/competencies`, { failOnStatusCode: false });
    expect(listResponse.status()).toBe(200);
    const list = await listResponse.json();
    expect(Array.isArray(list.apprentices)).toBe(true);
    expect(list.apprentices.length).toBeGreaterThan(0);

    const apprentice = list.apprentices.find((item: any) => item?.standard?.competencies?.length && item?.enrollmentId);
    expect(apprentice, 'No assigned registered apprentice with competencies found for Host Shop E2E account').toBeTruthy();

    const competency = apprentice.standard.competencies[0];
    const original = (apprentice.competencyRecords || []).find((row: any) => row.competency_id === competency.id);
    const originalCompleted = Boolean(original?.completed);
    const testCompleted = !originalCompleted;

    const mutate = await page.request.patch(`${BASE}/api/host-shop/competencies`, {
      data: { enrollmentId: apprentice.enrollmentId, competencyId: competency.id, completed: testCompleted, notes: 'Automated reversible E2E verification' },
      failOnStatusCode: false,
    });
    expect(mutate.status()).toBe(200);

    try {
      const verifyResponse = await page.request.get(`${BASE}/api/host-shop/competencies`, { failOnStatusCode: false });
      expect(verifyResponse.status()).toBe(200);
      const verifyBody = await verifyResponse.json();
      const reloadedApprentice = verifyBody.apprentices.find((item: any) => item.enrollmentId === apprentice.enrollmentId);
      const persisted = (reloadedApprentice?.competencyRecords || []).find((row: any) => row.competency_id === competency.id);
      expect(Boolean(persisted?.completed)).toBe(testCompleted);
      expect(persisted?.verified_by_name).toBeTruthy();
      if (testCompleted) expect(persisted?.date_completed).toBeTruthy();
    } finally {
      const restore = await page.request.patch(`${BASE}/api/host-shop/competencies`, {
        data: { enrollmentId: apprentice.enrollmentId, competencyId: competency.id, completed: originalCompleted, notes: original?.notes || null },
        failOnStatusCode: false,
      });
      expect(restore.status()).toBe(200);
    }

    const restoredResponse = await page.request.get(`${BASE}/api/host-shop/competencies`, { failOnStatusCode: false });
    expect(restoredResponse.status()).toBe(200);
    const restoredBody = await restoredResponse.json();
    const restoredApprentice = restoredBody.apprentices.find((item: any) => item.enrollmentId === apprentice.enrollmentId);
    const restored = (restoredApprentice?.competencyRecords || []).find((row: any) => row.competency_id === competency.id);
    expect(Boolean(restored?.completed)).toBe(originalCompleted);
  });
});
