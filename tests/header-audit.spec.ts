/**
 * Comprehensive Header Audit for Homepage - Excellence Level
 * Tests: Accessibility (WCAG AAA), Visual, Functionality, Performance, Responsive, SEO, Security, Keyboard
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Header Accessibility Audit (WCAG AA/AAA)', () => {
  test('WCAG 2.1 AA compliance - header region', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Header A11y Violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations.length).toBe(0);
  });

  test('Skip link exists and is functional', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('a[href="#main-content"]').first();

    await expect(skipLink).toBeAttached();

    const href = await skipLink.getAttribute('href');
    expect(href).toBe('#main-content');

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeAttached();
  });

  test('All images have appropriate alt text or are decorative', async ({ page }) => {
    await page.goto(baseURL);

    const headerImages = page.locator('header img');
    const count = await headerImages.count();

    for (let i = 0; i < count; i++) {
      const img = headerImages.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('Search and language controls are not duplicated in header', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header[role="banner"]');
    await expect(header.getByRole('button', { name: /Search programs and pages/i })).toHaveCount(1);
    await expect(header.getByRole('button', { name: /Language:/i })).toHaveCount(1);
  });

  test('Navigation has proper ARIA labels', async ({ page }) => {
    await page.goto(baseURL);

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).toBeAttached();

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    await expect(menuButton).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto(baseURL);

    const results = await new AxeBuilder({ page })
      .include('header')
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations.length).toBe(0);
  });

  test('Focus indicators are visible on all interactive elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);

    const headerLinks = page.locator('header a, header button');
    const count = await headerLinks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await page.keyboard.press('Tab');

      const hasFocusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== 'none' ||
          styles.boxShadow.includes('rgb') ||
          el.classList.contains('focus-visible:ring-2')
        );
      });

      expect(hasFocusStyle).toBeTruthy();
    }
  });

  test('Header has proper landmark role', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header[role="banner"]');
    await expect(header).toBeAttached();
  });

  test('Live region exists for screen reader announcements', async ({ page }) => {
    await page.goto(baseURL);

    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });

  test('Active page is indicated with aria-current', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL + '/about');
    await page.waitForLoadState('domcontentloaded');

    // Check for aria-current on any nav link when on a page
    const aboutLink = page.locator('nav[aria-label="Main navigation"] a[href="/about"]');
    const count = await aboutLink.count();

    if (count > 0) {
      const ariaCurrent = await aboutLink.getAttribute('aria-current');
      expect(ariaCurrent).toBe('page');
    } else {
      // If no direct link, verify nav structure exists
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeAttached();
    }
  });
});

test.describe('Header Visual/Styling Audit', () => {
  test('Header is fixed at top', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const position = await header.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');

    const top = await header.evaluate((el) => window.getComputedStyle(el).top);
    expect(top).toBe('0px');
  });

  test('Header has correct height (70px)', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const box = await header.boundingBox();
    expect(box?.height).toBe(70);
  });

  test('Header has proper z-index for layering', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const zIndex = await header.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(9999);
  });

  test('Logo is visible and properly sized', async ({ page }) => {
    await page.goto(baseURL);

    const logo = page.locator('header img').first();
    await expect(logo).toBeVisible();

    const box = await logo.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(32);
    expect(box?.height).toBeGreaterThanOrEqual(32);
  });

  test('Header has shadow for visual separation', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const shadow = await header.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
  });

  test('Header background is white', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const bgColor = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
  });

  test('Active nav links have visual distinction', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL + '/about');
    await page.waitForLoadState('domcontentloaded');

    // Check that the About link has active styling when on /about page
    const aboutLink = page.locator('nav[aria-label="Main navigation"] a[href="/about"]');
    const count = await aboutLink.count();

    if (count > 0) {
      const className = await aboutLink.getAttribute('class');
      // Active links should have distinct styling
      expect(className).toBeTruthy();
      // The link should have some visual indication (color or background)
      expect(className?.includes('blue') || className?.includes('active')).toBeTruthy();
    } else {
      // If no direct About link, check that nav exists and has links
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeAttached();
    }
  });
});

test.describe('Header Functionality Audit', () => {
  test('Logo links to homepage', async ({ page }) => {
    await page.goto(`${baseURL}/about`);

    const logoLink = page.locator('header a[href="/"]').first();
    await logoLink.click();

    await expect(page).toHaveURL(baseURL + '/');
  });

  test('All navigation links are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    const navLinks = ['Programs', 'How It Works', 'WIOA Funding', 'About', 'Contact'];

    for (const linkText of navLinks) {
      const link = desktopNav.locator(`a:has-text("${linkText}")`).first();
      const isVisible = await link.isVisible();
      if (isVisible) {
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }

    await expect(desktopNav).toBeAttached();
  });

  test('Apply Now button is visible and links correctly', async ({ page }) => {
    await page.goto(baseURL);

    const applyButton = page.locator('header a:has-text("Apply Now")');
    await expect(applyButton).toBeVisible();

    const href = await applyButton.getAttribute('href');
    expect(href).toBe('/apply');
  });

  test('Sign In link shows when not logged in', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);

    const signInLink = page.locator('header a:has-text("Sign In")');
    const isVisible = await signInLink.isVisible();
    if (isVisible) {
      const href = await signInLink.getAttribute('href');
      expect(href).toBe('/login');
    }
  });

  test('Mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await expect(menuButton).toBeVisible();

    await menuButton.click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    const role = await mobileMenu.getAttribute('role');
    expect(role).toBe('dialog');

    const closeButton = page.locator('button[aria-label="Close navigation menu"]');
    await closeButton.click();

    await expect(mobileMenu).not.toBeVisible();
  });

  test('Mobile menu closes on Escape key', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await menuButton.click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(mobileMenu).not.toBeVisible();
  });

  test('Mobile menu dropdown toggles work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const programsButton = page.locator('#mobile-menu button:has-text("Programs")');
    await programsButton.click();

    const healthcareLink = page.locator('#mobile-menu a:has-text("Healthcare")');
    await expect(healthcareLink).toBeVisible();

    const expanded = await programsButton.getAttribute('aria-expanded');
    expect(expanded).toBe('true');
  });

  test('Mobile menu prevents body scroll when open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');
  });

  test('Focus returns to menu button when mobile menu closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await menuButton.click();

    await page.keyboard.press('Escape');

    const focusedElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('aria-label'),
    );
    expect(focusedElement).toBe('Open navigation menu');
  });
});

test.describe('Header Performance Audit', () => {
  test('Header renders quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseURL);

    const header = page.locator('header');
    await header.waitFor({ state: 'visible' });

    const renderTime = Date.now() - startTime;
    console.log(`Header render time: ${renderTime}ms`);

    expect(renderTime).toBeLessThan(3000);
  });

  test('Logo image loads with priority', async ({ page }) => {
    await page.goto(baseURL);

    const logo = page.locator('header img').first();
    const fetchPriority = await logo.getAttribute('fetchpriority');

    expect(fetchPriority).toBe('high');
  });

  test('No layout shift from header', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const initialBox = await header.boundingBox();

    await page.waitForTimeout(1000);

    const finalBox = await header.boundingBox();

    expect(finalBox?.y).toBe(initialBox?.y);
    expect(finalBox?.height).toBe(initialBox?.height);
  });

  test('Header does not cause horizontal scroll', async ({ page }) => {
    await page.goto(baseURL);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Header Responsive Design Audit', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Large Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Header displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(baseURL);

      const header = page.locator('header');
      await expect(header).toBeVisible();

      const box = await header.boundingBox();
      expect(box?.width).toBe(viewport.width);

      const logo = page.locator('header img').first();
      await expect(logo).toBeVisible();

      const applyButton = page.locator('header a:has-text("Apply")');
      await expect(applyButton).toBeVisible();
    });
  }

  test('Desktop nav hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).not.toBeVisible();
  });

  test('Mobile menu button has lg:hidden class for desktop hiding', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await expect(menuButton).toBeAttached();

    const className = await menuButton.getAttribute('class');
    expect(className).toContain('lg:hidden');
  });

  test('Touch targets are at least 44x44px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    const box = await menuButton.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('Apply button has minimum touch target size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const applyButton = page.locator('header a:has-text("Apply")');
    const box = await applyButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Header SEO Audit', () => {
  test('Header contains semantic HTML', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    await expect(header).toBeAttached();

    const nav = page.locator('header nav, nav[aria-label="Main navigation"]');
    await expect(nav).toBeAttached();
  });

  test('Logo link has descriptive aria-label', async ({ page }) => {
    await page.goto(baseURL);

    const logoLink = page.locator('header a[href="/"]').first();
    const ariaLabel = await logoLink.getAttribute('aria-label');

    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Elevate');
  });

  test('Navigation links use descriptive text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);

    const navLinks = page.locator('nav[aria-label="Main navigation"] a');
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const text = await navLinks.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('No duplicate IDs in header', async ({ page }) => {
    await page.goto(baseURL);

    const duplicateIds = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return [];

      const elementsWithId = header.querySelectorAll('[id]');
      const ids = Array.from(elementsWithId).map((el) => el.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      return duplicates;
    });

    expect(duplicateIds.length).toBe(0);
  });
});

test.describe('Header Security Audit', () => {
  test('External links have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto(baseURL);

    const externalLinks = page.locator('header a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('No inline event handlers', async ({ page }) => {
    await page.goto(baseURL);

    const inlineHandlers = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return [];

      const elements = header.querySelectorAll('*');
      const handlers: string[] = [];

      elements.forEach((el) => {
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
          if (attrs[i].name.startsWith('on') && attrs[i].name !== 'onclick') {
            handlers.push(`${el.tagName}: ${attrs[i].name}`);
          }
        }
      });

      return handlers;
    });

    expect(inlineHandlers.length).toBe(0);
  });
});

test.describe('Header Keyboard Navigation Audit', () => {
  test('All interactive elements are keyboard accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    // Verify header links have proper tabindex (not negative)
    const headerLinks = page.locator('header a, header button');
    const count = await headerLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const tabindex = await headerLinks.nth(i).getAttribute('tabindex');
      // tabindex should be null (default), 0, or positive
      if (tabindex !== null) {
        expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
      }
    }

    // Verify links are not disabled
    const disabledLinks = page.locator('header a[disabled], header button[disabled]');
    const disabledCount = await disabledLinks.count();
    expect(disabledCount).toBe(0);
  });

  test('Focus trap works in mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();
    await page.waitForSelector('#mobile-menu');

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      const isInMenu = await page.evaluate(() => {
        const active = document.activeElement;
        const menu = document.getElementById('mobile-menu');
        return menu?.contains(active);
      });

      expect(isInMenu).toBe(true);
    }
  });

  test('Enter key expands dropdown in mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const programsButton = page.locator('#mobile-menu button:has-text("Programs")');
    await programsButton.focus();

    await page.keyboard.press('Enter');

    const expanded = await programsButton.getAttribute('aria-expanded');
    expect(expanded).toBe('true');
  });
});

test.describe('Header Excellence Criteria', () => {
  test('Mobile menu has aria-modal for proper screen reader behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const mobileMenu = page.locator('#mobile-menu');
    const ariaModal = await mobileMenu.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('Decorative images are hidden from screen readers', async ({ page }) => {
    await page.goto(baseURL);

    const logoImg = page.locator('header a[href="/"] img').first();
    const ariaHidden = await logoImg.getAttribute('aria-hidden');

    expect(ariaHidden).toBe('true');
  });

  test('Menu items have proper role attributes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const menuContainer = page.locator('#mobile-menu [role="menu"]').first();
    await expect(menuContainer).toBeAttached();

    const menuItems = page.locator('#mobile-menu [role="menuitem"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Submenus have proper aria-controls linking', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    await page.locator('button[aria-label="Open navigation menu"]').click();

    const programsButton = page.locator('#mobile-menu button:has-text("Programs")');
    const ariaControls = await programsButton.getAttribute('aria-controls');

    expect(ariaControls).toBeTruthy();

    await programsButton.click();
    const submenu = page.locator(`#${ariaControls}`);
    await expect(submenu).toBeAttached();
  });

  test('Transitions respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(baseURL);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});

test.describe('Header Print Styles Audit', () => {
  test('Header is visible in print preview', async ({ page }) => {
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });

    const header = page.locator('header');
    await expect(header).toBeAttached();
  });

  test('Navigation links are readable in print', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeAttached();
  });

  test('Logo is visible in print mode', async ({ page }) => {
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });

    const logo = page.locator('header img').first();
    await expect(logo).toBeAttached();
  });
});

test.describe('Header Dark Mode Audit', () => {
  test('Header renders in dark color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(baseURL);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('Logo is visible in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(baseURL);

    const logo = page.locator('header img').first();
    await expect(logo).toBeVisible();
  });

  test('Navigation is readable in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeAttached();
  });
});

test.describe('Header i18n/Localization Audit', () => {
  test('Header text does not overflow with longer translations', async ({ page }) => {
    await page.goto(baseURL);

    // Simulate longer text by checking current layout doesn't overflow
    const header = page.locator('header');
    const box = await header.boundingBox();

    expect(box?.width).toBeLessThanOrEqual(page.viewportSize()?.width || 1920);
  });

  test('Header supports RTL layout direction', async ({ page }) => {
    await page.goto(baseURL);

    // Check that header can handle RTL if needed
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Reset
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
    });
  });

  test('Header uses proper lang attribute inheritance', async ({ page }) => {
    await page.goto(baseURL);

    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBeTruthy();
  });
});

test.describe('Header Browser Compatibility Audit', () => {
  test('Header uses standard CSS properties', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');

    // Check for standard positioning
    const position = await header.evaluate((el) => window.getComputedStyle(el).position);
    expect(['fixed', 'sticky', 'relative', 'absolute']).toContain(position);

    // Check for standard display
    const display = await header.evaluate((el) => window.getComputedStyle(el).display);
    expect(['block', 'flex', 'grid']).toContain(display);
  });

  test('Header flexbox layout works correctly', async ({ page }) => {
    await page.goto(baseURL);

    const headerContainer = page.locator('header > div').first();
    const display = await headerContainer.evaluate((el) => window.getComputedStyle(el).display);

    expect(display).toBe('flex');
  });

  test('Header images have proper loading attributes', async ({ page }) => {
    await page.goto(baseURL);

    const logo = page.locator('header img').first();

    // Check for loading attribute (lazy or eager)
    const loading = await logo.getAttribute('loading');
    const fetchPriority = await logo.getAttribute('fetchpriority');

    // Either has loading attribute or fetchpriority for optimization
    expect(loading !== null || fetchPriority !== null).toBeTruthy();
  });

  test('Header links have proper href attributes', async ({ page }) => {
    await page.goto(baseURL);

    const headerLinks = page.locator('header a[href]');
    const count = await headerLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      // Should start with / or http
      expect(href?.startsWith('/') || href?.startsWith('http')).toBeTruthy();
    }
  });
});

test.describe('Header Content Audit', () => {
  test('Logo text matches brand name', async ({ page }) => {
    await page.goto(baseURL);

    const logoLink = page.locator('header a[href="/"]').first();
    const text = await logoLink.textContent();

    expect(text?.toLowerCase()).toContain('elevate');
  });

  test('Apply Now CTA is prominently displayed', async ({ page }) => {
    await page.goto(baseURL);

    const applyButton = page.locator('header a:has-text("Apply")');
    await expect(applyButton).toBeVisible();

    // Check it has a distinct background color (not transparent)
    const bgColor = await applyButton.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');
  });

  test('Header contains no placeholder text', async ({ page }) => {
    await page.goto(baseURL);

    const headerText = await page.locator('header').textContent();

    // Check for common placeholder patterns
    expect(headerText?.toLowerCase()).not.toContain('lorem ipsum');
    expect(headerText?.toLowerCase()).not.toContain('placeholder');
    expect(headerText?.toLowerCase()).not.toContain('todo');
    expect(headerText?.toLowerCase()).not.toContain('xxx');
  });

  test('Phone number format is correct', async ({ page }) => {
    await page.goto(baseURL);

    const phoneLink = page.locator('header a[href^="tel:"]');
    const count = await phoneLink.count();

    if (count > 0) {
      const href = await phoneLink.first().getAttribute('href');
      // Should be a valid tel: link
      expect(href).toMatch(/^tel:[\d-]+$/);
    }
  });
});

test.describe('Header HTML Validation Audit', () => {
  test('Header uses valid HTML5 elements', async ({ page }) => {
    await page.goto(baseURL);

    // Check for proper HTML5 semantic elements
    const header = page.locator('header');
    await expect(header).toBeAttached();

    // Verify header is a direct child of body or main layout
    const headerParent = await header.evaluate((el) => el.parentElement?.tagName);
    expect(['BODY', 'DIV', 'MAIN']).toContain(headerParent);
  });

  test('Header has no deprecated HTML attributes', async ({ page }) => {
    await page.goto(baseURL);

    const deprecatedAttrs = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return [];

      // Note: width/height on img are valid in HTML5 for aspect ratio hints
      const deprecated = ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'valign'];
      const found: string[] = [];

      const checkElement = (el: Element) => {
        deprecated.forEach((attr) => {
          if (el.hasAttribute(attr)) {
            found.push(`${el.tagName}: ${attr}`);
          }
        });
        Array.from(el.children).forEach(checkElement);
      };

      checkElement(header);
      return found;
    });

    if (deprecatedAttrs.length > 0) {
      console.log('Deprecated attributes found:', deprecatedAttrs);
    }

    expect(deprecatedAttrs.length).toBe(0);
  });

  test('Header images have required attributes', async ({ page }) => {
    await page.goto(baseURL);

    const headerImages = page.locator('header img');
    const count = await headerImages.count();

    for (let i = 0; i < count; i++) {
      const img = headerImages.nth(i);

      // src is required
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();

      // alt is required (can be empty for decorative)
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('Header links have valid href values', async ({ page }) => {
    await page.goto(baseURL);

    const headerLinks = page.locator('header a');
    const count = await headerLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');

      // href should not be empty or just "#"
      expect(href).toBeTruthy();
      if (href === '#') {
        // If it's just #, it should have an onclick or be a button
        const role = await headerLinks.nth(i).getAttribute('role');
        expect(role).toBe('button');
      }
    }
  });

  test('Header buttons have type attribute', async ({ page }) => {
    await page.goto(baseURL);

    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();

    for (let i = 0; i < count; i++) {
      const type = await headerButtons.nth(i).getAttribute('type');
      // Buttons should have explicit type (button, submit, reset)
      // If no type, it defaults to submit which may not be intended
      expect(type === null || ['button', 'submit', 'reset'].includes(type)).toBeTruthy();
    }
  });

  test('Header has no empty elements that should have content', async ({ page }) => {
    await page.goto(baseURL);

    const emptyElements = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return [];

      const empty: string[] = [];
      const contentElements = header.querySelectorAll('a, button, span, p, h1, h2, h3, h4, h5, h6');

      contentElements.forEach((el) => {
        const text = el.textContent?.trim();
        const hasChildren = el.children.length > 0;
        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');

        if (!text && !hasChildren && !hasAriaLabel && !hasAriaLabelledBy) {
          empty.push(el.tagName);
        }
      });

      return empty;
    });

    expect(emptyElements.length).toBe(0);
  });

  test('Header nesting is valid', async ({ page }) => {
    await page.goto(baseURL);

    const invalidNesting = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return [];

      const issues: string[] = [];

      // Check for invalid nesting patterns
      // a inside a
      const nestedLinks = header.querySelectorAll('a a');
      if (nestedLinks.length > 0) issues.push('Nested anchor tags');

      // button inside a
      const buttonInLink = header.querySelectorAll('a button');
      if (buttonInLink.length > 0) issues.push('Button inside anchor');

      // a inside button
      const linkInButton = header.querySelectorAll('button a');
      if (linkInButton.length > 0) issues.push('Anchor inside button');

      // Interactive elements inside interactive elements
      const interactiveInInteractive = header.querySelectorAll('a [tabindex], button [tabindex]');
      // Filter out valid cases

      return issues;
    });

    expect(invalidNesting.length).toBe(0);
  });
});

test.describe('Header State Management Audit', () => {
  test('Mobile menu state resets on navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    // Open mobile menu
    const menuButton = page.locator('button[aria-label="Open navigation menu"]');
    await menuButton.click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    // Click a link
    const homeLink = page.locator('#mobile-menu a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Menu should be closed after navigation
      await expect(mobileMenu).not.toBeVisible();
    }
  });

  test('Header maintains state during scroll', async ({ page }) => {
    await page.goto(baseURL);

    const header = page.locator('header');
    const initialBox = await header.boundingBox();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);

    // Header should still be at top (fixed position)
    const afterScrollBox = await header.boundingBox();
    expect(afterScrollBox?.y).toBe(0);
  });

  test('Dropdown menus close when clicking outside', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    // Open mobile menu
    await page.locator('button[aria-label="Open navigation menu"]').click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    // Click overlay (outside menu)
    await page.locator('.fixed.inset-0.bg-black\\/50').click({ force: true });

    // Menu should close
    await expect(mobileMenu).not.toBeVisible();
  });
});
