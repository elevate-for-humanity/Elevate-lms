import { test, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';

test('unauthenticated Program Holder dashboard redirects to login without dropping return target', async ({ browser }) => {
  // A fresh context guarantees no inherited authenticated session or cached worker.
  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const response = await context.request.get(
      `${base}/program-holder/dashboard?verify=redirect-acceptance`,
      { maxRedirects: 0, failOnStatusCode: false },
    );
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()['location'];
    expect(location, 'missing login redirect').toBeTruthy();
    const destination = new URL(location!, base);
    expect(destination.pathname).toBe('/login');
    expect(destination.searchParams.get('redirect')).toBe(
      '/program-holder/dashboard?verify=redirect-acceptance',
    );
  } finally {
    await context.close();
  }
});
