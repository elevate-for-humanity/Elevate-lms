import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const APPRENTICE_EMAIL = process.env.E2E_APPRENTICE_EMAIL || process.env.TEST_STUDENT_EMAIL || '';
const APPRENTICE_PASSWORD = process.env.E2E_APPRENTICE_PASSWORD || process.env.TEST_STUDENT_PASSWORD || '';
const HOST_EMAIL = process.env.E2E_HOST_SHOP_EMAIL || '';
const HOST_PASSWORD = process.env.E2E_HOST_SHOP_PASSWORD || '';
const ADMIN_BASE = process.env.PLAYWRIGHT_ADMIN_URL || 'https://admin.elevateforhumanity.org';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

async function login(page: Page, email: string, password: string, base = BASE) {
  const response = await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status() ?? 200, 'Login route returned a server error').toBeLessThan(500);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible({ timeout: 15_000 });
  await expect(passwordInput).toBeVisible({ timeout: 15_000 });
  await expect(submit).toBeVisible({ timeout: 15_000 });
  // The production login intentionally keeps controls disabled until React is
  // hydrated. Enabled controls are the authoritative user-ready signal; a
  // persistent connection on the page means networkidle is not reliable.
  await expect(emailInput).toBeEnabled({ timeout: 20_000 });
  await expect(passwordInput).toBeEnabled({ timeout: 20_000 });
  await expect(submit).toBeEnabled({ timeout: 20_000 });

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 }),
    submit.click(),
  ]);
}

async function expectPortalRoute(page: Page, path: string, expectedText?: RegExp) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status() ?? 200, `${path} returned a server error`).toBeLessThan(500);
  expect(page.url(), `${path} redirected to unauthorized`).not.toContain('/unauthorized');
  expect(page.url(), `${path} unexpectedly returned to login`).not.toMatch(/\/login(?:\?|$)/);
  if (expectedText) await expect(page.locator('body')).toContainText(expectedText);
}

async function expectBrowserDeniedFromPortal(page: Page, path: string) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status() ?? 200, `${path} returned a server error`).toBeLessThan(500);
  await expect
    .poll(() => new URL(page.url()).pathname, {
      message: `${path} remained accessible to the wrong portal role`,
      timeout: 15_000,
    })
    .not.toMatch(/^\/host-shop\/dashboard(?:\/|$)/);
  expect(page.url(), `${path} did not resolve to an authorization/login boundary`).toMatch(/\/(?:unauthorized|host-shop\/login|login)(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /host shop dashboard/i })).toHaveCount(0);
}

test.describe('Registered apprenticeship authorization', () => {
  test.skip(!APPRENTICE_EMAIL || !APPRENTICE_PASSWORD, 'Authenticated apprentice credentials are required');

  test('apprentice can use canonical dashboard surfaces but cannot use Host Shop verifier API', async ({ page, browser }) => {
    await login(page, APPRENTICE_EMAIL, APPRENTICE_PASSWORD);

    await expectPortalRoute(page, '/apprentice', /apprentice|registered|competenc|RTI/i);

    const readOnlySurfaces = [
      '/apprentice/hours',
      '/apprentice/rti',
      '/apprentice/competencies',
      '/apprentice/documents',
      '/apprentice/attendance',
      '/apprentice/profile',
      '/apprentice/handbook',
    ];
    for (const path of readOnlySurfaces) await expectPortalRoute(page, path);

    // Exercise the authenticated document workflow with synthetic evidence.
    // The upload is verified through the same API that renders the dashboard,
    // then removed so production never accumulates disposable QA documents.
    const requirementsResponse = await page.request.get(
      `${BASE}/api/apprentice/documents?program=barber-apprenticeship`,
      { failOnStatusCode: false },
    );
    expect(requirementsResponse.status()).toBe(200);
    const requirements = await requirementsResponse.json();
    const governmentId = requirements.documentTypes?.find(
      (item: any) => item.document_type === 'government_id',
    );
    expect(governmentId?.id, 'Government-issued ID requirement is missing').toBeTruthy();

    const syntheticPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const uploadResponse = await page.request.post(`${BASE}/api/apprentice/documents`, {
      multipart: {
        file: {
          name: 'qa-synthetic-government-id.png',
          mimeType: 'image/png',
          buffer: syntheticPng,
        },
        documentTypeId: governmentId.id,
        programSlug: 'barber-apprenticeship',
      },
      failOnStatusCode: false,
    });
    expect(uploadResponse.status()).toBe(200);
    const uploaded = await uploadResponse.json();
    expect(uploaded?.document?.id).toBeTruthy();

    try {
      const verifyUploadResponse = await page.request.get(
        `${BASE}/api/apprentice/documents?program=barber-apprenticeship`,
        { failOnStatusCode: false },
      );
      expect(verifyUploadResponse.status()).toBe(200);
      const verifiedDocuments = await verifyUploadResponse.json();
      expect(
        verifiedDocuments.uploadedDocuments?.some(
          (document: any) =>
            document.id === uploaded.document.id &&
            document.file_name === 'qa-synthetic-government-id.png' &&
            document.document_type === 'government_id' &&
            document.status === 'pending',
        ),
        'Synthetic government ID upload did not persist',
      ).toBe(true);

      expect(ADMIN_EMAIL, 'Disposable admin email was not provisioned').toBeTruthy();
      expect(ADMIN_PASSWORD, 'Disposable admin password was not provisioned').toBeTruthy();
      // Keep the admin session isolated so its shared-domain auth cookies cannot
      // replace the apprentice session needed for ownership-scoped cleanup.
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      try {
        await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_BASE);
        const adminReview = await adminPage.goto(`${ADMIN_BASE}/documents/review`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        expect(adminReview?.status() ?? 200, 'Admin document review returned a server error').toBeLessThan(500);
        expect(adminPage.url()).not.toMatch(/\/(?:login|unauthorized)(?:\?|$)/);
        // This assertion certifies that the deployed Admin review queue reads
        // the same canonical documents table written by the apprentice API.
        await expect(adminPage.locator('body')).toContainText('qa-synthetic-government-id.png');
        await expect(adminPage.locator('body')).toContainText('[QA E2E] Barber Apprentice');
        await expect(adminPage.locator('body')).toContainText(/Government Id/i);
        await expect(adminPage.locator('body')).toContainText(/Pending/i);
      } finally {
        await adminContext.close();
      }
    } finally {
      const cleanupResponse = await page.request.delete(
        `${BASE}/api/apprentice/documents?id=${encodeURIComponent(uploaded.document.id)}`,
        { failOnStatusCode: false },
      );
      expect(cleanupResponse.status()).toBe(200);
    }

    // Keep a direct API assertion for server-side authorization.
    const forbidden = await page.request.patch(`${BASE}/api/host-shop/competencies`, {
      data: { enrollmentId: '00000000-0000-0000-0000-000000000000', competencyId: 'not-authorized', completed: true },
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(forbidden.status());

    // App Router page redirects are a browser-navigation contract. A raw
    // APIRequestContext response can expose the streamed RSC shell as HTTP 200
    // even though the authenticated browser is redirected by the server layout.
    // Verify the actual production user path rather than treating raw status as
    // equivalent to portal access.
    await expectBrowserDeniedFromPortal(page, '/host-shop/dashboard');
  });
});

test.describe('Host Shop production workspace', () => {
  test.skip(!HOST_EMAIL || !HOST_PASSWORD, 'Authenticated Host Shop credentials are required');

  test('assigned Host Shop can reach scoped operational surfaces', async ({ page }) => {
    await login(page, HOST_EMAIL, HOST_PASSWORD);

    await expectPortalRoute(page, '/host-shop/dashboard', /host shop/i);

    const operationalSurfaces = [
      '/host-shop/dashboard/apprentices',
      '/host-shop/dashboard/hours/pending',
      '/host-shop/dashboard/documents',
      '/host-shop/dashboard/competencies',
      '/host-shop/dashboard/attendance/record',
      '/host-shop/dashboard/wages',
      '/host-shop/dashboard/reports',
      '/host-shop/dashboard/profile',
    ];
    for (const path of operationalSurfaces) await expectPortalRoute(page, path);

    const listResponse = await page.request.get(`${BASE}/api/host-shop/competencies`, { failOnStatusCode: false });
    expect(listResponse.status()).toBe(200);
    const list = await listResponse.json();
    expect(Array.isArray(list.apprentices)).toBe(true);
    expect(list.apprentices.length).toBeGreaterThan(0);

    for (const item of list.apprentices) {
      expect(item?.enrollmentId).toBeTruthy();
      expect(item?.standard).toBeTruthy();
    }
  });

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
      data: {
        enrollmentId: apprentice.enrollmentId,
        competencyId: competency.id,
        completed: testCompleted,
        notes: 'Automated reversible E2E verification',
        ...(testCompleted
          ? {
              performanceSubject: 'mannequin',
              evidenceType: 'observation',
              evidenceUrl: `https://qa.invalid/apprenticeship-evidence/${apprentice.enrollmentId}/${competency.id}`,
              performedAt: new Date().toISOString().slice(0, 10),
              instructorLicenseNumber: 'QA-E2E-IN-0001',
            }
          : {}),
      },
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
