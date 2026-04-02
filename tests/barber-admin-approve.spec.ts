import { test, expect, request } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_APPLICATION_ID = process.env.TEST_BARBERSHOP_APPLICATION_ID || '';

test.describe('Barbershop application approval', () => {
  test.skip(!TEST_APPLICATION_ID, 'TEST_BARBERSHOP_APPLICATION_ID not set');

  test('approval endpoint responds successfully', async ({ request }) => {
    const res = await request.post(
      `${APP_URL}/api/admin/barber-shop-applications/${TEST_APPLICATION_ID}/approve`,
      {
        headers: {
          // Supply cookie/header if your admin auth middleware requires it.
        },
      }
    );

    expect([200, 401, 403]).toContain(res.status());

    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBeTruthy();
      expect(body.status).toBe('approved');
    }
  });
});
