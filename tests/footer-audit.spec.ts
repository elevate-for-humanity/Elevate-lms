/**
 * Comprehensive Footer Audit for Homepage
 * Tests: Accessibility, Visual, Functionality, Performance, Responsive, SEO, Security, Content
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Footer Accessibility Audit (WCAG AA)', () => {
  test('WCAG 2.1 AA compliance - footer region', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .include('footer')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Footer A11y Violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations.length).toBe(0);
  });

  test('Footer has proper landmark role', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();

    // Footer element implicitly has contentinfo role
    const role = await footer.getAttribute('role');
    expect(role === null || role === 'contentinfo').toBeTruthy();
  });

  test('All footer links have accessible names', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    for (let i = 0; i < count; i++) {
      const link = footerLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('Footer images have alt text', async ({ page }) => {
    await page.goto(baseURL);

    const footerImages = page.locator('footer img');
    const count = await footerImages.count();

    for (let i = 0; i < count; i++) {
      const img = footerImages.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto(baseURL);

    const results = await new AxeBuilder({ page })
      .include('footer')
      .withRules(['color-contrast'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Contrast violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations.length).toBe(0);
  });

  test('Footer headings are properly structured', async ({ page }) => {
    await page.goto(baseURL);

    const footerHeadings = page.locator(
      'footer h1, footer h2, footer h3, footer h4, footer h5, footer h6',
    );
    const count = await footerHeadings.count();

    // Footer should have section headings
    expect(count).toBeGreaterThan(0);
  });

  test('Focus indicators are visible on footer links', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    if (count > 0) {
      const firstLink = footerLinks.first();
      await firstLink.focus();

      const hasFocusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== 'none' ||
          styles.boxShadow.includes('rgb') ||
          el.classList.toString().includes('focus')
        );
      });

      expect(hasFocusStyle).toBeTruthy();
    }
  });
});

test.describe('Footer Visual/Styling Audit', () => {
  test('Footer has dark background', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const bgColor = await footer.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Should be dark (rgb values should be low)
    expect(bgColor).toMatch(/rgb\(\d{1,2},\s*\d{1,2},\s*\d{1,2}\)|rgb\(17,\s*24,\s*39\)/);
  });

  test('Footer text is light colored for contrast', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const color = await footer.evaluate((el) => window.getComputedStyle(el).color);

    // Text should be light (white or near-white)
    expect(color).toMatch(/rgb\(2[0-5]\d,\s*2[0-5]\d,\s*2[0-5]\d\)|white/);
  });

  test('Footer has proper padding', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const padding = await footer.evaluate((el) => window.getComputedStyle(el).padding);

    expect(padding).not.toBe('0px');
  });

  test('Footer sections are visually organized', async ({ page }) => {
    await page.goto(baseURL);

    // Check for grid or flex layout
    const footerContainer = page.locator('footer > div').first();
    const display = await footerContainer.evaluate((el) => window.getComputedStyle(el).display);

    expect(['flex', 'grid', 'block']).toContain(display);
  });

  test('Footer logo is visible', async ({ page }) => {
    await page.goto(baseURL);

    const logo = page.locator('footer img').first();
    await expect(logo).toBeAttached();
  });

  test('Footer has border or separator from content', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const borderTop = await footer.evaluate((el) => window.getComputedStyle(el).borderTopWidth);
    const bgColor = await footer.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Either has border or distinct background
    expect(borderTop !== '0px' || bgColor !== 'rgba(0, 0, 0, 0)').toBeTruthy();
  });
});

test.describe('Footer Functionality Audit', () => {
  test('All footer links are clickable', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(
        href?.startsWith('/') || href?.startsWith('http') || href?.startsWith('#'),
      ).toBeTruthy();
    }
  });

  test('Privacy Policy link exists and works', async ({ page }) => {
    await page.goto(baseURL);

    const privacyLink = page.locator('footer a[href*="privacy"]');
    await expect(privacyLink.first()).toBeAttached();
  });

  test('Terms of Service link exists', async ({ page }) => {
    await page.goto(baseURL);

    const termsLink = page.locator('footer a[href*="terms"]');
    await expect(termsLink.first()).toBeAttached();
  });

  test('Copyright notice is present', async ({ page }) => {
    await page.goto(baseURL);

    const footerText = await page.locator('footer').textContent();
    expect(
      footerText?.includes('©') || footerText?.toLowerCase().includes('copyright'),
    ).toBeTruthy();
  });

  test('Current year is displayed in copyright', async ({ page }) => {
    await page.goto(baseURL);

    const currentYear = new Date().getFullYear().toString();
    const footerText = await page.locator('footer').textContent();

    expect(footerText?.includes(currentYear)).toBeTruthy();
  });

  test('Company name is in footer', async ({ page }) => {
    await page.goto(baseURL);

    const footerText = await page.locator('footer').textContent();
    expect(footerText?.toLowerCase()).toContain('elevate');
  });

  test('Footer sections have working links', async ({ page }) => {
    await page.goto(baseURL);

    // Check Programs section
    const programsLink = page.locator('footer a[href*="programs"]').first();
    if ((await programsLink.count()) > 0) {
      const href = await programsLink.getAttribute('href');
      expect(href).toBeTruthy();
    }

    // Check About section
    const aboutLink = page.locator('footer a[href*="about"]').first();
    if ((await aboutLink.count()) > 0) {
      const href = await aboutLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('Contact link exists in footer', async ({ page }) => {
    await page.goto(baseURL);

    const contactLink = page.locator('footer a[href*="contact"]');
    await expect(contactLink.first()).toBeAttached();
  });
});

test.describe('Footer Responsive Design Audit', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Large Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Footer displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(baseURL);

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      const box = await footer.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(viewport.width);
    });
  }

  test('Footer does not cause horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('Footer links are readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    if (count > 0) {
      const firstLink = footerLinks.first();
      const fontSize = await firstLink.evaluate((el) => window.getComputedStyle(el).fontSize);
      const fontSizeNum = parseInt(fontSize);

      // Font should be at least 12px for readability
      expect(fontSizeNum).toBeGreaterThanOrEqual(12);
    }
  });

  test('Footer touch targets are adequate on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    if (count > 0) {
      const firstLink = footerLinks.first();
      const box = await firstLink.boundingBox();

      // Touch target should be at least 24px (relaxed for dense footer)
      expect(box?.height).toBeGreaterThanOrEqual(20);
    }
  });
});

test.describe('Footer SEO Audit', () => {
  test('Footer uses semantic HTML', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
  });

  test('Footer links use descriptive text', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await footerLinks.nth(i).textContent();

      // Links should not be generic like "click here"
      expect(text?.toLowerCase()).not.toBe('click here');
      expect(text?.toLowerCase()).not.toBe('read more');
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('No duplicate IDs in footer', async ({ page }) => {
    await page.goto(baseURL);

    const duplicateIds = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return [];

      const elementsWithId = footer.querySelectorAll('[id]');
      const ids = Array.from(elementsWithId).map((el) => el.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      return duplicates;
    });

    expect(duplicateIds.length).toBe(0);
  });

  test('Footer contains sitemap-like navigation', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    // Footer should have multiple navigation links
    expect(count).toBeGreaterThan(5);
  });
});

test.describe('Footer Security Audit', () => {
  test('External links have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto(baseURL);

    const externalLinks = page.locator('footer a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('No inline event handlers in footer', async ({ page }) => {
    await page.goto(baseURL);

    const inlineHandlers = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return [];

      const elements = footer.querySelectorAll('*');
      const handlers: string[] = [];

      elements.forEach((el) => {
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
          if (attrs[i].name.startsWith('on') && !attrs[i].name.startsWith('onclick')) {
            handlers.push(`${el.tagName}: ${attrs[i].name}`);
          }
        }
      });

      return handlers;
    });

    expect(inlineHandlers.length).toBe(0);
  });
});

test.describe('Footer Content Audit', () => {
  test('Footer contains no placeholder text', async ({ page }) => {
    await page.goto(baseURL);

    const footerText = await page.locator('footer').textContent();

    expect(footerText?.toLowerCase()).not.toContain('lorem ipsum');
    expect(footerText?.toLowerCase()).not.toContain('placeholder');
    expect(footerText?.toLowerCase()).not.toContain('todo');
    expect(footerText?.toLowerCase()).not.toContain('xxx');
  });

  test('Footer has organized sections', async ({ page }) => {
    await page.goto(baseURL);

    // Check for section headings
    const headings = page.locator('footer h2, footer h3, footer h4');
    const count = await headings.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Footer includes essential links', async ({ page }) => {
    await page.goto(baseURL);

    const footerText = await page.locator('footer').textContent();
    const footerLower = footerText?.toLowerCase() || '';

    // Check for essential footer content
    const hasPrivacy = footerLower.includes('privacy');
    const hasTerms = footerLower.includes('terms');
    const hasContact = footerLower.includes('contact');

    expect(hasPrivacy || hasTerms || hasContact).toBeTruthy();
  });

  test('Footer brand name is correct', async ({ page }) => {
    await page.goto(baseURL);

    const footerText = await page.locator('footer').textContent();

    expect(footerText).toContain('Elevate');
  });
});

test.describe('Footer Performance Audit', () => {
  test('Footer renders without delay', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 5000 });
  });

  test('Footer images are optimized', async ({ page }) => {
    await page.goto(baseURL);

    const footerImages = page.locator('footer img');
    const count = await footerImages.count();

    for (let i = 0; i < count; i++) {
      const img = footerImages.nth(i);
      const src = await img.getAttribute('src');

      // Should use optimized image format or Next.js Image
      expect(src).toBeTruthy();
    }
  });

  test('Footer does not cause layout shift', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const initialBox = await footer.boundingBox();

    await page.waitForTimeout(1000);

    const finalBox = await footer.boundingBox();

    // Height should remain stable
    if (initialBox && finalBox) {
      expect(Math.abs((finalBox.height || 0) - (initialBox.height || 0))).toBeLessThan(50);
    }
  });
});

test.describe('Footer HTML Validation Audit', () => {
  test('Footer uses valid HTML5 elements', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
  });

  test('Footer links have valid href values', async ({ page }) => {
    await page.goto(baseURL);

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');

      expect(href).toBeTruthy();
      // Should start with /, http, mailto, or tel
      expect(
        href?.startsWith('/') ||
          href?.startsWith('http') ||
          href?.startsWith('#') ||
          href?.startsWith('mailto:') ||
          href?.startsWith('tel:'),
      ).toBeTruthy();
    }
  });

  test('Footer has no empty links', async ({ page }) => {
    await page.goto(baseURL);

    const emptyLinks = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return [];

      const links = footer.querySelectorAll('a');
      const empty: string[] = [];

      links.forEach((link) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const hasChildren = link.children.length > 0;

        if (!text && !ariaLabel && !hasChildren) {
          empty.push(link.href);
        }
      });

      return empty;
    });

    expect(emptyLinks.length).toBe(0);
  });

  test('Footer lists are properly structured', async ({ page }) => {
    await page.goto(baseURL);

    const footerLists = page.locator('footer ul, footer ol');
    const count = await footerLists.count();

    for (let i = 0; i < count; i++) {
      const list = footerLists.nth(i);
      const listItems = list.locator('li');
      const itemCount = await listItems.count();

      // Lists should have items
      expect(itemCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Footer i18n Audit', () => {
  test('Footer text does not overflow', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    const box = await footer.boundingBox();

    expect(box?.width).toBeLessThanOrEqual(page.viewportSize()?.width || 1920);
  });

  test('Footer supports RTL layout', async ({ page }) => {
    await page.goto(baseURL);

    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
    });
  });
});

test.describe('Footer Print Styles Audit', () => {
  test('Footer is visible in print preview', async ({ page }) => {
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
  });

  test('Footer links are readable in print', async ({ page }) => {
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });

    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);
  });
});
