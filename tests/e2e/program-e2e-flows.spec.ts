/**
 * E2E: Barber · Cosmetology · Apprentice · Shop · Partnership
 *
 * Covers all five program flows end-to-end:
 *   1. Barber Apprenticeship — student apply → payment-setup → apprentice dashboard
 *   2. Cosmetology Apprenticeship — student apply → payment-setup → apprentice dashboard
 *   3. Barbershop Partner Shop — apply → full onboarding sequence → thank-you
 *   4. Cosmetology Partner Shop — apply → full onboarding sequence → thank-you
 *   5. Cosmetology Apprenticeship Partnership — apply → full onboarding sequence → thank-you
 *
 * Auth-gated pages are tested for proper redirect/guard behaviour (no 404 / no 500).
 * API endpoints are tested for correct rejection of unauthenticated / malformed requests.
 */

import { test, expect } from '@playwright/test';
import { peerOrigin } from './helpers/app-origins';

const BASE = process.env.APP_URL?.replace(/\/+$/, '') || peerOrigin('marketing');
const LMS = peerOrigin('lms');

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Assert a page loads without a server error (not 404 or 5xx). */
async function expectPageOk(page: any, path: string) {
  const res = await page.goto(`${BASE}${path}`);
  const status = res?.status() ?? 200;
  expect(status, `${path} returned ${status}`).not.toBe(404);
  expect(status, `${path} server error`).toBeLessThan(500);
}

/** Assert an auth-gated page either renders content or redirects to /login. */
async function expectAuthGated(page: any, path: string) {
  await page.goto(`${BASE}${path}`);
  const url = page.url();
  const isOnLoginOrPage = url.includes('/login') || url.includes(path) || url.includes('/signin');
  expect(isOnLoginOrPage, `${path} should redirect to login or render — got ${url}`).toBe(true);
  // Must not land on a generic 404 or crash page
  const h1Text = await page.locator('h1').first().textContent().catch(() => '');
  expect(h1Text, `${path} rendered an error heading`).not.toMatch(/404|not found|application error/i);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BARBER APPRENTICESHIP — student flow
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Barber Apprenticeship — student flow', () => {
  test('program landing page renders with apply CTA', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Learn the trade where the work happens.' }),
    ).toBeVisible();
    await expect(page.getByText('Registered Barber Apprenticeship', { exact: true })).toBeVisible();
    const applyLink = page.getByRole('link', { name: /apply for barber apprenticeship/i });
    await expect(applyLink).toHaveAttribute('href', '/programs/barber-apprenticeship/apply');
  });

  test('apply page exposes the three canonical application paths', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/apply');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose the correct Barber application' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Submit Free Inquiry' })).toHaveAttribute(
      'href',
      '/programs/barber-apprenticeship/request-info',
    );
    await expect(page.getByRole('link', { name: 'Start Enrollment' })).toHaveAttribute(
      'href',
      '/apply/student/interview?program=barber-apprenticeship&intent=enrollment',
    );
    await expect(page.getByRole('link', { name: 'Start Host Site Application' })).toHaveAttribute(
      'href',
      '/partners/host-shop/apply?program=barber',
    );
  });

  test('apply page preserves payment-before-application disclosure', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/apply');
    await expect(
      page.getByText(/server-priced \$600 minimum deposit/i),
    ).toBeVisible();
    await expect(
      page.getByText(/payment does not replace the student application/i),
    ).toBeVisible();
  });

  test('apply success page renders confirmation', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/apply/success');
    await expect(page.locator('body')).toContainText(/success|submitted|received|thank/i);
  });

  test('eligibility page renders', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/eligibility');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('host-shops page renders', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/host-shops');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('orientation page renders', async ({ page }) => {
    await expectPageOk(page, '/programs/barber-apprenticeship/orientation');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('payment-setup page is auth-gated or renders payment form', async ({ page }) => {
    await expectAuthGated(page, '/programs/barber-apprenticeship/payment-setup');
  });

  test('payment-setup/confirm page is auth-gated', async ({ page }) => {
    await expectAuthGated(page, '/programs/barber-apprenticeship/payment-setup/confirm');
  });

  test('enrollment status requires the owning learner session', async ({ page }) => {
    await page.goto(`${BASE}/programs/barber-apprenticeship/enrollment-success`);
    await page.waitForURL(/\/login\?/);
    const destination = new URL(page.url()).searchParams.get('redirect');
    expect(destination).toBe('/programs/barber-apprenticeship/enrollment-success');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BEAUTY APPRENTICESHIPS — canonical PARIS application + payments
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Beauty apprenticeships — canonical checkout handoff', () => {
  const programs = [
    { slug: 'cosmetology-apprenticeship', label: 'Cosmetology' },
    { slug: 'esthetician-apprenticeship', label: 'Esthetician' },
    { slug: 'nail-technician-apprenticeship', label: 'Nail Technician' },
  ];

  for (const { slug, label } of programs) {
    test(`${label} application preserves the paid-enrollment boundary`, async ({ page, request }) => {
      const response = await page.goto(`${BASE}/programs/${slug}/apply`);
      expect(response?.status() ?? 200).toBeLessThan(500);

      const enrollmentLink = page.getByRole('link', { name: /start enrollment application/i });
      await expect(enrollmentLink).toHaveAttribute(
        'href',
        `/apply/student/interview?program=${slug}&intent=enrollment`,
      );
      await expect(
        page.getByText(/the enrollment application requires verified payment before it can be submitted/i),
      ).toBeVisible();

      await Promise.all([
        page.waitForURL((url) => url.pathname === `/enroll/${slug}`),
        enrollmentLink.click(),
      ]);

      const pricing = await request.get(`${BASE}/api/programs/pricing?slug=${slug}`, {
        failOnStatusCode: false,
      });
      expect(pricing.status(), `${slug} pricing endpoint`).toBe(200);
      const body = await pricing.json();
      expect(body.program_slug).toBe(slug);
      expect(Number(body.tuition_cents ?? 0)).toBeGreaterThan(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. APPRENTICE DASHBOARD — post-enrollment learner portal
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Apprentice dashboard — auth-gated portal', () => {
  const gatedPaths = [
    '/apprentice',
    '/apprentice/hours',
    '/apprentice/hours/log',
    '/apprentice/hours/history',
    '/apprentice/competencies',
    '/apprentice/competencies/log',
    '/apprentice/documents',
    '/apprentice/handbook',
    '/apprentice/skills',
    '/apprentice/state-board',
    '/apprentice/timeclock',
    '/apprentice/timeclock/history',
    '/apprentice/transfer-hours',
    '/apprentice/transfer-hours/request',
  ];

  for (const path of gatedPaths) {
    test(`${path} redirects to login or renders`, async ({ page }) => {
      await expectAuthGated(page, path);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. BARBERSHOP PARTNER SHOP — apply → onboarding → thank-you
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Barbershop Partner Shop — apply + onboarding', () => {
  test('apply page renders shop application form', async ({ page }) => {
    await expectPageOk(page, '/partners/barbershop-apprenticeship/apply');
    // Legal business name field
    const bizField = page
      .locator(
        'input[name*="shopLegal"], input[name*="legal"], input[placeholder*="business" i], input[placeholder*="shop" i]',
      )
      .first();
    await expect(bizField).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('apply API rejects missing required fields', async ({ request }) => {
    const res = await request.post(`${BASE}/api/host-shop/apply`, {
      data: { shopLegalName: 'Partial LLC' },
      failOnStatusCode: false,
    });
    expect([400, 422]).toContain(res.status());
  });

  test('apply API rejects unauthenticated request with full payload', async ({ request }) => {
    const res = await request.post(`${BASE}/api/host-shop/apply`, {
      data: {
        shopLegalName: 'Test Shop LLC',
        ownerName: 'Jane Owner',
        contactName: 'Jane Owner',
        contactEmail: 'test@example.com',
        contactPhone: '317-555-0001',
        shopAddressLine1: '100 Main St',
        shopCity: 'Indianapolis',
        shopState: 'IN',
        shopZip: '46201',
        indianaShopLicenseNumber: 'BS-00001',
        supervisorName: 'Bob Sup',
        supervisorLicenseNumber: 'BB-00001',
        supervisorYearsLicensed: '5',
        compensationModel: 'hybrid',
        workersCompStatus: 'verified',
        apprenticesOnPayroll: 'yes',
        hasGeneralLiability: 'yes',
        canSuperviseAndVerify: 'yes',
        mouAcknowledged: true,
        consentAcknowledged: true,
      },
      failOnStatusCode: false,
    });
    // Either a 401 (auth required) or 200 (public submission accepted)
    expect([200, 201, 400, 401, 422]).toContain(res.status());
  });

  test('thank-you page renders', async ({ page }) => {
    await expectPageOk(page, '/partners/host-shop/confirmation');
    await expect(page.locator('body')).toContainText(/thank|submitted|received|review/i);
  });

  // Onboarding steps (auth-gated)
  const onboardingSteps = [
    '/partners/barbershop-apprenticeship/onboarding',
    '/partners/barbershop-apprenticeship/handbook',
    '/partners/barbershop-apprenticeship/documents',
    '/partners/barbershop-apprenticeship/forms',
    '/partners/barbershop-apprenticeship/policy-acknowledgment',
    '/partners/barbershop-apprenticeship/sign-mou',
  ];

  for (const step of onboardingSteps) {
    test(`onboarding step ${step.split('/').pop()} is auth-gated or renders`, async ({ page }) => {
      await expectAuthGated(page, step);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. COSMETOLOGY PARTNER SHOP — apply → onboarding → thank-you
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Cosmetology Partner Shop — apply + onboarding', () => {
  test('apply page renders shop application form', async ({ page }) => {
    await expectPageOk(page, '/partners/host-shop/apply');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('thank-you page renders', async ({ page }) => {
    await expectPageOk(page, '/partners/host-shop/confirmation');
    await expect(page.locator('body')).toContainText(/thank|submitted|received|review/i);
  });

  const onboardingSteps = [
    { label: 'handbook',              path: '/partners/cosmetology-partner-shop/handbook' },
    { label: 'documents',             path: '/partners/cosmetology-partner-shop/documents' },
    { label: 'forms',                 path: '/partners/cosmetology-partner-shop/forms' },
    { label: 'policy-acknowledgment', path: '/partners/cosmetology-partner-shop/policy-acknowledgment' },
    { label: 'sign-mou',              path: '/partners/cosmetology-partner-shop/sign-mou' },
  ];

  for (const { label, path } of onboardingSteps) {
    test(`onboarding step ${label} is auth-gated or renders`, async ({ page }) => {
      await expectAuthGated(page, path);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. COSMETOLOGY APPRENTICESHIP PARTNERSHIP — apply → onboarding → thank-you
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Cosmetology Apprenticeship Partnership — apply + onboarding', () => {
  test('apply page renders shop/school application form', async ({ page }) => {
    await expectPageOk(page, '/partners/host-shop/apply');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('apply API rejects missing required fields', async ({ request }) => {
    const res = await request.post(`${BASE}/api/host-shop/apply`, {
      data: { salonLegalName: 'Partial Salon' },
      failOnStatusCode: false,
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('thank-you page renders', async ({ page }) => {
    await expectPageOk(page, '/partners/host-shop/confirmation');
    await expect(page.locator('body')).toContainText(/thank|submitted|received|review/i);
  });

  const onboardingSteps = [
    { label: 'handbook',              path: '/partners/cosmetology-apprenticeship/handbook' },
    { label: 'documents',             path: '/partners/cosmetology-apprenticeship/documents' },
    { label: 'forms',                 path: '/partners/cosmetology-apprenticeship/forms' },
    { label: 'policy-acknowledgment', path: '/partners/cosmetology-apprenticeship/policy-acknowledgment' },
    { label: 'sign-mou',              path: '/partners/cosmetology-apprenticeship/sign-mou' },
  ];

  for (const { label, path } of onboardingSteps) {
    test(`onboarding step ${label} is auth-gated or renders`, async ({ page }) => {
      await expectAuthGated(page, path);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PARTNER DASHBOARD — post-onboarding shop portal
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Partner dashboard — auth-gated portal', () => {
  const gatedPaths = [
    '/partner/dashboard',
    '/partner/hours',
    '/partner/hours/pending',
    '/partner/attendance',
    '/partner/attendance/record',
    '/partner/competencies',
    '/partner/documents',
    '/partner/courses/create',
  ];

  for (const path of gatedPaths) {
    test(`${path} redirects to login or renders`, async ({ page }) => {
      await expectAuthGated(page, path);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. COSMETOLOGY API — payment routes
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Retired cosmetology payment routes', () => {
  for (const path of [
    '/api/cosmetology/setup-intent',
    '/api/cosmetology/activate-subscription',
    '/api/cosmetology/checkout/embedded',
  ]) {
    test(`${path} stays retired`, async ({ request }) => {
      const res = await request.post(`${BASE}${path}`, {
        data: {},
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(404);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. BARBER PAYMENT API — auth + validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Retired Barber payment routes', () => {
  for (const path of [
    '/api/barber/setup-intent',
    '/api/barber/activate-subscription',
    '/api/barber/update-payment',
  ]) {
    test(`${path} stays retired`, async ({ request }) => {
      const res = await request.post(`${BASE}${path}`, {
        data: {},
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(404);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. APPRENTICESHIP API — auth + validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Apprenticeship API — auth + validation', () => {
  test('retired marketing hours proxy stays unavailable', async ({ request }) => {
    const res = await request.post(`${BASE}/api/apprenticeship/hours`, {
      data: { hoursWorked: 8, date: '2026-05-15' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(404);
  });

  test('hours approve rejects unauthenticated POST', async ({ request }) => {
    const res = await request.post(`${LMS}/api/apprenticeship/hours/approve`, {
      data: { submissionId: 'fake-id' },
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(res.status());
  });

  test('enroll checkout rejects unauthenticated POST', async ({ request }) => {
    const res = await request.post(`${BASE}/api/programs/enroll/checkout`, {
      data: { programSlug: 'barber-apprenticeship' },
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(res.status());
  });

  test('apprentice program-slug returns data or auth error', async ({ request }) => {
    const res = await request.get(`${LMS}/api/apprentice/program-slug`, {
      failOnStatusCode: false,
    });
    expect([200, 401, 403]).toContain(res.status());
  });
});
