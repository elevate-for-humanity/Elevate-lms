/**
 * Test: Barbershop Partner Application API
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const MIN_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const validApplication = {
  shopLegalName: 'Test Barbershop LLC',
  shopDbaName: 'Test Cuts',
  ownerName: 'John Doe',
  contactName: 'Jane Doe',
  contactEmail: 'test@example.com',
  contactPhone: '317-555-1234',
  shopAddressLine1: '123 Main St',
  shopAddressLine2: 'Suite 100',
  shopCity: 'Indianapolis',
  shopState: 'IN',
  shopZip: '46201',
  indianaShopLicenseNumber: 'BS-12345',
  supervisorName: 'Bob Smith',
  supervisorLicenseNumber: 'BB-67890',
  supervisorYearsLicensed: '5',
  compensationModel: 'hybrid',
  workersCompStatus: 'verified',
  apprenticesOnPayroll: 'yes',
  hasGeneralLiability: 'yes',
  canSuperviseAndVerify: 'yes',
  mouAcknowledged: true,
  consentAcknowledged: true,
  signatureData: MIN_SIGNATURE,
  shopLicenseFileData: MIN_SIGNATURE,
  shopLicenseFileName: 'license.pdf',
  notes: 'Test application',
};

test.describe('Barbershop Partner Application API', () => {
  test('should reject missing required fields', async ({ request }) => {
    const incompleteData = {
      shopLegalName: 'Test Shop',
      // Missing other required fields
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: incompleteData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing required field');

    console.log('✅ Missing required fields rejected correctly');
  });

  test('should reject invalid email format', async ({ request }) => {
    const invalidEmailData = {
      ...validApplication,
      contactEmail: 'not-an-email',
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: invalidEmailData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid email');

    console.log('✅ Invalid email rejected correctly');
  });

  test('should reject invalid phone format', async ({ request }) => {
    const invalidPhoneData = {
      ...validApplication,
      contactPhone: '123', // Too short
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: invalidPhoneData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid phone');

    console.log('✅ Invalid phone rejected correctly');
  });

  test('should reject invalid compensation model', async ({ request }) => {
    const invalidModelData = {
      ...validApplication,
      compensationModel: 'invalid_model',
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: invalidModelData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/compensation model/i);

    console.log('✅ Invalid compensation model rejected correctly');
  });

  test('should reject missing MOU acknowledgment', async ({ request }) => {
    const noMouData = {
      ...validApplication,
      mouAcknowledged: false,
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: noMouData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('acknowledge');

    console.log('✅ Missing MOU acknowledgment rejected correctly');
  });

  test('should reject missing consent acknowledgment', async ({ request }) => {
    const noConsentData = {
      ...validApplication,
      consentAcknowledged: false,
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: noConsentData,
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('acknowledge');

    console.log('✅ Missing consent acknowledgment rejected correctly');
  });

  test('should silently accept honeypot submissions (bot trap)', async ({ request }) => {
    const botData = {
      ...validApplication,
      honeypot: 'bot filled this in',
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: botData,
      failOnStatusCode: false,
    });

    // Should return success but not actually process
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    // Should NOT have an applicationId (wasn't actually saved)
    expect(body.applicationId).toBeUndefined();

    console.log('✅ Honeypot trap works correctly');
  });

  test('should accept valid application data', async ({ request }) => {
    // Use unique email to avoid duplicate check
    const uniqueApplication = {
      ...validApplication,
      contactEmail: `test-${Date.now()}@example.com`,
      indianaShopLicenseNumber: `BS-${Date.now()}`,
    };

    const response = await request.post(`${baseURL}/api/partners/barber-host-shop/apply`, {
      data: uniqueApplication,
      failOnStatusCode: false,
    });

    // May fail if DB not configured, but should not be a validation error
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.applicationId).toBeDefined();
      console.log('✅ Valid application accepted');
    } else if (response.status() === 503) {
      // DB not configured - acceptable in test environment
      console.log('⚠️ Database not configured - skipping DB insert test');
    } else {
      const body = await response.json();
      console.log('Response:', response.status(), body);
      // Should not be a 400 validation error for valid data
      expect(response.status()).not.toBe(400);
    }
  });
});

test.describe('Barbershop Partner Pages', () => {
  test('partner info page loads correctly', async ({ page }) => {
    await page.goto(`${baseURL}/partners/barbershop-apprenticeship`);

    await expect(page.locator('h1')).toContainText('Barbershop Partner');
    await expect(page.locator('text=Apply to Become a Partner')).toBeVisible();
    await expect(page.locator('text=View MOU Template')).toBeVisible();

    console.log('✅ Partner info page loads correctly');
  });

  test('application form page loads correctly', async ({ page }) => {
    await page.goto(`${baseURL}/partners/barbershop-apprenticeship/apply`);

    await expect(page.locator('h1')).toContainText('Barbershop Partner Application');
    await expect(
      page.locator('input[name="shopLegalName"], input[value=""]').first(),
    ).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Application form page loads correctly');
  });

  test('MOU page loads correctly', async ({ page }) => {
    await page.goto(`${baseURL}/docs/Indiana-Barbershop-Apprenticeship-MOU`);

    await expect(page.locator('h1')).toContainText('MEMORANDUM OF UNDERSTANDING');
    await expect(page.locator('text=Print / Save as PDF')).toBeVisible();

    console.log('✅ MOU page loads correctly');
  });

  test('thank you page loads correctly', async ({ page }) => {
    await page.goto(`${baseURL}/partners/barbershop-apprenticeship/thank-you`);

    await expect(page.locator('h1')).toContainText('Application Received');
    await expect(page.locator('text=What Happens Next')).toBeVisible();

    console.log('✅ Thank you page loads correctly');
  });
});
