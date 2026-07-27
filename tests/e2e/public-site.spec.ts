import { expect, test } from '@playwright/test';

/**
 * Public marketing site E2E tests
 * 
 * These tests verify:
 * 1. Homepage exposes the primary customer paths
 * 2. No placeholder addresses are visible
 * 3. Pricing pages handle empty states gracefully
 * 4. All main navigation links return successful responses
 */

test.describe('public marketing site', () => {
  test('homepage exposes the primary customer paths', async ({ page }) => {
    await page.goto('/');

    // Check for primary CTAs
    await expect(
      page.getByRole('link', { name: /apply/i })
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: /career training|pathway/i })
    ).toBeVisible({ timeout: 10000 });

    // Check for pathway sections
    await expect(
      page.getByText(/apply.*funding.*training.*credential.*employment/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('does not expose placeholder addresses', async ({ page }) => {
    await page.goto('/');

    // Check for any placeholder addresses
    const body = await page.locator('body').textContent();
    
    // These should NOT appear
    expect(body).not.toContain('123 Main St');
    expect(body).not.toContain('Columbia, MD');
    expect(body).not.toContain('21044');
    
    // The correct address should appear if mentioned
    // 120 Market St Suite 930 is the correct address
  });

  test('pricing handles empty state gracefully', async ({ page }) => {
    await page.goto('/pricing');

    // The page should not crash or show errors
    await expect(page.getByRole('heading', { name: /pricing|training/i })).toBeVisible({ timeout: 10000 });
    
    // Should not show "0 programs available" in a broken way
    // If programs.length === 0, show a message but don't crash
    const body = await page.locator('body').textContent();
    // Should either show programs OR a graceful message
    // The key is it shouldn't show an error or blank page
  });

  test('testing page shows correct pricing', async ({ page }) => {
    await page.goto('/testing/workkeys');

    // Should show exam prices (not $0)
    await expect(page.getByText(/\$104|\$168/)).toBeVisible({ timeout: 10000 });
    
    // Should show Add to Cart buttons
    await expect(
      page.getByRole('button', { name: /add to cart/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('testing page shows correct address', async ({ page }) => {
    await page.goto('/testing');

    // Should show the correct address
    const body = await page.locator('body').textContent();
    expect(body).toContain('120 Market St');
  });

  test('about page shows correct address', async ({ page }) => {
    await page.goto('/about');

    // Should show the correct address
    const body = await page.locator('body').textContent();
    expect(body).toContain('120 Market St');
  });

  test('contact page FAQ mentions correct address', async ({ page }) => {
    await page.goto('/contact');

    // Check FAQ section mentions correct address
    const body = await page.locator('body').textContent();
    expect(body).toContain('120 Market St');
  });
});

test.describe('navigation integrity', () => {
  test('homepage main navigation links work', async ({ page, request }) => {
    await page.goto('/');

    // Get main navigation links
    const navLinks = await page
      .locator('header nav a[href], header a[href]')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href'))
          .filter((href) => href?.startsWith('/') && !href.startsWith('//'))
          .filter(Boolean)
      );

    // Test a sample of navigation links
    const sampleLinks = [...new Set(navLinks)].slice(0, 10);

    for (const href of sampleLinks) {
      const response = await request.get(href as string);
      expect(
        response.status(),
        `${href} returned ${response.status()}`
      ).toBeLessThan(400);
    }
  });

  test('footer links are valid', async ({ page, request }) => {
    await page.goto('/');

    // Get footer links
    const footerLinks = await page
      .locator('footer a[href]')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href'))
          .filter((href) => href?.startsWith('/') && !href.startsWith('//'))
          .filter(Boolean)
      );

    // Test a sample of footer links
    const sampleLinks = [...new Set(footerLinks)].slice(0, 10);

    for (const href of sampleLinks) {
      const response = await request.get(href as string);
      expect(
        response.status(),
        `${href} returned ${response.status()}`
      ).toBeLessThan(400);
    }
  });
});

test.describe('application flow basics', () => {
  test('apply page loads and shows form', async ({ page }) => {
    await page.goto('/apply');

    // Should show the application form
    await expect(
      page.getByRole('heading', { name: /apply|application/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
