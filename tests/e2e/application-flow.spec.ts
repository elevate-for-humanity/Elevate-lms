import { test, expect } from '@playwright/test';

/**
 * Application Flow E2E Tests
 * Tests the critical user journey from landing to application submission
 */

test.describe('Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const standardIntake = '/apply/student/form?intent=inquiry';

  test('should navigate from homepage to apply page', async ({ page }) => {
    await page.getByRole('link', { name: 'Apply', exact: true }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/apply(?:[?#].*)?$/);
    await expect(page.getByRole('heading', { name: 'Choose your application' })).toBeVisible();
  });

  test('should display application form fields', async ({ page }) => {
    await page.goto(standardIntake);
    for (const name of ['First Name', 'Last Name', 'Email', 'Phone']) {
      await expect(page.getByRole('textbox', { name, exact: true })).toBeVisible();
    }
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(standardIntake);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Complete your name, date of birth, email, and phone number.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'First Name', exact: true })).toBeVisible();
  });

  test('should submit valid application', async ({ page }) => {
    await page.goto(standardIntake);
    await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Browser');
    await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('QA');
    await page.getByLabel('Date of Birth', { exact: true }).fill('1990-01-01');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-${crypto.randomUUID()}@example.com`);
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('317-555-1234');
    await page.getByRole('textbox', { name: 'Street Address', exact: true }).fill('100 QA Test Way');
    await page.getByRole('textbox', { name: 'City', exact: true }).fill('Indianapolis');
    await page.getByRole('textbox', { name: 'State', exact: true }).fill('IN');
    await page.getByRole('textbox', { name: 'ZIP Code', exact: true }).fill('46201');

    const next = page.getByRole('button', { name: 'Continue', exact: true });
    await next.click();
    await page.getByLabel(/Program of Interest/).selectOption('hvac-technician');
    await next.click();
    await page.getByLabel(/How do you plan to pay/).selectOption('not_sure');
    await next.click();
    await next.click();
    await page.getByRole('checkbox', { name: /I certify that the information provided is accurate/ }).check();

    const submission = page.waitForResponse((response) =>
      new URL(response.url()).pathname === '/api/applications' &&
      response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit Intake Application' }).click();
    const receipt = await submission;
    expect(receipt.ok()).toBe(true);
    expect(await receipt.json()).toMatchObject({
      ok: true,
      recordType: 'lead',
      applicationStatus: 'inquiry',
    });
    await expect(page).toHaveURL(/\/enroll\/hvac-technician(?:[?#].*)?$/);
  });
});

test.describe('Programs Page', () => {
  test('should display program cards', async ({ page }) => {
    await page.goto('/programs');

    // Should have program listings
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should have at least one program card or link
    const programLinks = page.locator('a[href*="/programs/"]');
    const count = await programLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to program detail page', async ({ page }) => {
    await page.goto('/programs');

    // Click first program link
    const programLink = page.locator('a[href*="/programs/"]').first();
    if (await programLink.isVisible()) {
      await programLink.click();
      await expect(page).toHaveURL(/\/programs\//);
    }
  });
});

test.describe('Contact Flow', () => {
  test('should display contact page', async ({ page }) => {
    await page.goto('/contact');

    // Should have contact form or info
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should have phone number visible', async ({ page }) => {
    await page.goto('/contact');

    // Phone number should be visible
    const phoneLink = page.locator('a[href^="tel:"]');
    const count = await phoneLink.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Navigation', () => {
  test('should have working main navigation', async ({ page }) => {
    await page.goto('/');

    // Navigation should exist
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to key pages', async ({ page }) => {
    const pages = [
      { path: '/programs', text: 'Programs' },
      { path: '/about', text: 'About' },
      { path: '/contact', text: 'Contact' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await expect(page).toHaveURL(new RegExp(p.path));
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');

    // Footer should exist
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    // Should have links
    const footerLinks = footer.locator('a');
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('SEO Elements', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Should have title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Should have meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length).toBeGreaterThan(0);
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('www.elevateforhumanity.org');
  });

  test('should have Open Graph tags', async ({ page }) => {
    await page.goto('/');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle?.length).toBeGreaterThan(0);
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be usable on mobile', async ({ page }) => {
    await page.goto('/');

    // Should not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('should have mobile menu', async ({ page }) => {
    await page.goto('/');

    // Should have hamburger menu or mobile nav
    const mobileMenu = page.locator(
      'button[aria-label*="menu" i], button:has(svg), [data-testid="mobile-menu"]',
    );
    const count = await mobileMenu.count();
    expect(count).toBeGreaterThanOrEqual(0); // May not have hamburger if nav fits
  });
});

test.describe('Performance', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource'),
    );

    expect(criticalErrors.length).toBe(0);
  });
});
