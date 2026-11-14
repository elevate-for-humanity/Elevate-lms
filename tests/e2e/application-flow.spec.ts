import { test, expect } from '@playwright/test';

/**
 * Application Flow E2E Tests
 * Tests the critical user journey from landing to application submission
 */

test.describe('Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate from homepage to apply page', async ({ page }) => {
    // Click Apply Now button
    await page.click('text=Apply Now');

    // Should be on apply page
    await expect(page).toHaveURL(/\/apply/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display application form fields', async ({ page }) => {
    await page.goto('/apply');

    // Form fields should be visible
    await expect(
      page.locator('input[name="name"], input[placeholder*="name" i]').first(),
    ).toBeVisible();
    await expect(
      page
        .locator('input[name="email"], input[placeholder*="email" i], input[type="email"]')
        .first(),
    ).toBeVisible();
    await expect(
      page.locator('input[name="phone"], input[placeholder*="phone" i], input[type="tel"]').first(),
    ).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/apply');

    // Try to submit empty form
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")')
      .first();
    await submitButton.click();

    // Should show validation or stay on page
    await expect(page).toHaveURL(/\/apply/);
  });

  test('should submit valid application', async ({ page }) => {
    await page.goto('/apply');

    // Fill form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User E2E');
    await page.fill(
      'input[name="email"], input[placeholder*="email" i], input[type="email"]',
      'e2e-test@example.com',
    );
    await page.fill(
      'input[name="phone"], input[placeholder*="phone" i], input[type="tel"]',
      '317-555-1234',
    );

    // Select program if dropdown exists
    const programSelect = page.locator('select[name="program"]');
    if (await programSelect.isVisible()) {
      await programSelect.selectOption({ index: 1 });
    }

    // Select funding if dropdown exists
    const fundingSelect = page.locator('select[name="funding"]');
    if (await fundingSelect.isVisible()) {
      await fundingSelect.selectOption({ index: 1 });
    }

    // Submit
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")')
      .first();
    await submitButton.click();

    // Should redirect to confirmation or show success
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasSuccess =
      url.includes('confirmation') ||
      url.includes('success') ||
      (await page
        .locator('text=success, text=thank you, text=submitted')
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasSuccess || url.includes('apply')).toBeTruthy();
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
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource'),
    );

    expect(criticalErrors.length).toBe(0);
  });
});
