import { test, expect } from '@playwright/test';

test.describe('Desktop Navigation Visibility', () => {
  test('Desktop navigation should be visible on laptop screen', async ({ page }) => {
    // Set viewport to laptop size
    await page.setViewportSize({ width: 1366, height: 768 });

    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find the desktop navigation
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');

    // Check if navigation exists
    await expect(desktopNav).toBeAttached();

    // Check if navigation is visible (not display: none)
    await expect(desktopNav).toBeVisible();

    // Check computed display style
    const display = await desktopNav.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });

    console.log('Desktop nav display:', display);
    expect(display).toBe('flex');

    // Check if navigation has items
    const navItems = desktopNav.locator('button, a');
    const count = await navItems.count();

    console.log('Navigation items found:', count);
    expect(count).toBeGreaterThan(0);

    // Check specific navigation sections
    const programsButton = desktopNav.locator('button:has-text("Programs")');
    await expect(programsButton).toBeVisible();

    const getStartedButton = desktopNav.locator('button:has-text("Get Started")');
    await expect(getStartedButton).toBeVisible();
  });

  test('Desktop navigation should be hidden on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');

    // Navigation should exist but not be visible
    await expect(desktopNav).toBeAttached();
    await expect(desktopNav).not.toBeVisible();

    // Check computed display style
    const display = await desktopNav.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });

    console.log('Mobile nav display:', display);
    expect(display).toBe('none');
  });

  test('Navigation dropdowns work on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    const programsButton = desktopNav.locator('button:has-text("Programs")');

    // Hover over Programs button
    await programsButton.hover();

    // Wait a bit for dropdown to appear
    await page.waitForTimeout(500);

    // Check if dropdown is visible
    const dropdown = page.locator('div.absolute:has(a:has-text("All Programs"))');
    await expect(dropdown).toBeVisible();

    // Check dropdown has items
    const dropdownLinks = dropdown.locator('a');
    const linkCount = await dropdownLinks.count();

    console.log('Dropdown links found:', linkCount);
    expect(linkCount).toBeGreaterThan(0);
  });

  test('All main navigation sections are present', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');

    // Check for all 6 main sections
    const sections = ['Programs', 'Get Started', 'Services', 'About', 'Resources', 'Contact'];

    for (const section of sections) {
      const sectionElement = desktopNav
        .locator(`button:has-text("${section}"), a:has-text("${section}")`)
        .first();
      await expect(sectionElement).toBeVisible();
      console.log(`✓ ${section} section found`);
    }
  });
});
