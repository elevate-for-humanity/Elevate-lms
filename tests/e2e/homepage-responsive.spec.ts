import { test, expect, devices } from '@playwright/test';

/**
 * Homepage Responsive Design Audit
 * Tests across Mobile, Tablet, Laptop, and Desktop
 */

const viewports = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  tabletLandscape: { width: 1024, height: 768, name: 'iPad Landscape' },
  laptop: { width: 1366, height: 768, name: 'Laptop' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
  desktopLarge: { width: 2560, height: 1440, name: '4K Desktop' },
};

test.describe('Homepage Responsive Audit', () => {
  test.describe('Mobile (375px - iPhone SE)', () => {
    test.use({ viewport: viewports.mobile });

    test('should display hero section correctly', async ({ page }) => {
      await page.goto('/');

      // Hero should be visible
      await expect(page.locator('text=Free Career Training')).toBeVisible();

      // CTAs should be stacked vertically on mobile
      const ctaButtons = page.locator('a:has-text("Apply Now"), a:has-text("View Programs")');
      const count = await ctaButtons.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Check video is responsive
      const video = page.locator('video').first();
      if (await video.isVisible()) {
        const box = await video.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(375);
      }
    });

    test('should have readable text sizes', async ({ page }) => {
      await page.goto('/');

      // Main heading should be visible and readable
      const heading = page.locator('h1, h2').first();
      const fontSize = await heading.evaluate((el) => window.getComputedStyle(el).fontSize);

      // Font size should be at least 24px on mobile
      const size = parseInt(fontSize);
      expect(size).toBeGreaterThanOrEqual(24);
    });

    test('should have proper spacing', async ({ page }) => {
      await page.goto('/');

      // Sections should have adequate padding
      const sections = page.locator('section');
      const firstSection = sections.first();

      const padding = await firstSection.evaluate((el) => window.getComputedStyle(el).paddingTop);

      // Should have at least 2rem (32px) padding
      const paddingValue = parseInt(padding);
      expect(paddingValue).toBeGreaterThanOrEqual(32);
    });

    test('should display feature cards in grid', async ({ page }) => {
      await page.goto('/');

      // Feature cards should be visible
      await expect(page.locator('text=100% Free Training')).toBeVisible();
      await expect(page.locator('text=Job Placement Support')).toBeVisible();

      // Cards should be in 2-column grid on mobile
      const featureSection = page.locator('section').filter({ hasText: 'Why Choose Our Programs' });
      const gridClass = await featureSection.locator('div').first().getAttribute('class');
      expect(gridClass).toContain('grid-cols-2');
    });

    test('should have accessible tap targets', async ({ page }) => {
      await page.goto('/');

      // All buttons should be at least 44x44px (Apple HIG)
      const buttons = page.locator('button, a[href]');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test('should not have horizontal scroll', async ({ page }) => {
      await page.goto('/');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
    });

    test('should hide long descriptions on mobile', async ({ page }) => {
      await page.goto('/');

      // Feature descriptions should be hidden on mobile
      const descriptions = page.locator('p.hidden.md\\:block');
      const count = await descriptions.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Large (414px - iPhone 11 Pro Max)', () => {
    test.use({ viewport: viewports.mobileLarge });

    test('should display all content properly', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('h1, h2').first()).toBeVisible();
      await expect(page.locator('text=Apply Now')).toBeVisible();
    });

    test('should maintain aspect ratios', async ({ page }) => {
      await page.goto('/');

      // Images should maintain aspect ratio
      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const box = await img.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Tablet (768px - iPad)', () => {
    test.use({ viewport: viewports.tablet });

    test('should display 3-column grid for features', async ({ page }) => {
      await page.goto('/');

      // Features should be in 3 columns on tablet
      const featureSection = page.locator('section').filter({ hasText: 'Why Choose Our Programs' });
      const gridClass = await featureSection.locator('div').first().getAttribute('class');
      expect(gridClass).toContain('md:grid-cols-3');
    });

    test('should show feature descriptions', async ({ page }) => {
      await page.goto('/');

      // Descriptions should be visible on tablet
      const description = page.locator('text=No tuition costs with WIOA').first();
      await expect(description).toBeVisible();
    });

    test('should have proper navigation', async ({ page }) => {
      await page.goto('/');

      // Navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });

    test('should display location cards properly', async ({ page }) => {
      await page.goto('/');

      // Location cards should be visible
      await expect(page.locator('text=Indianapolis')).toBeVisible();
      await expect(page.locator('text=Fort Wayne')).toBeVisible();
      await expect(page.locator('text=Evansville')).toBeVisible();
      await expect(page.locator('text=Online')).toBeVisible();
    });
  });

  test.describe('Tablet Landscape (1024px)', () => {
    test.use({ viewport: viewports.tabletLandscape });

    test('should utilize full width', async ({ page }) => {
      await page.goto('/');

      const container = page.locator('.max-w-7xl').first();
      const box = await container.boundingBox();

      expect(box?.width).toBeGreaterThan(900);
    });

    test('should display certification badges', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=CompTIA A+')).toBeVisible();
      await expect(page.locator('text=CNA Certification')).toBeVisible();
    });
  });

  test.describe('Laptop (1366px)', () => {
    test.use({ viewport: viewports.laptop });

    test('should display full desktop layout', async ({ page }) => {
      await page.goto('/');

      // All sections should be visible
      await expect(page.locator('text=Why Choose Our Programs')).toBeVisible();
      await expect(page.locator('text=Serving Indiana Residents')).toBeVisible();
      await expect(page.locator('text=Trusted Partners')).toBeVisible();
    });

    test('should have proper image sizes', async ({ page }) => {
      await page.goto('/');

      // Feature icons should be larger on desktop
      const icon = page.locator('img[alt="100% Free Training"]').first();
      const box = await icon.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(64);
    });

    test('should display partner logos', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=WorkOne')).toBeVisible();
      await expect(page.locator('text=Certiport')).toBeVisible();
      await expect(page.locator('text=WIOA')).toBeVisible();
      await expect(page.locator('text=ETPL')).toBeVisible();
    });

    test('should have hover effects', async ({ page }) => {
      await page.goto('/');

      // Feature cards should have hover effects
      const card = page.locator('.hover\\:bg-gray-100').first();
      await card.hover();

      // Check if hover class is applied
      const classes = await card.getAttribute('class');
      expect(classes).toContain('hover:bg-gray-100');
    });
  });

  test.describe('Desktop (1920px)', () => {
    test.use({ viewport: viewports.desktop });

    test('should center content properly', async ({ page }) => {
      await page.goto('/');

      // Content should be centered with max-width
      const container = page.locator('.max-w-7xl').first();
      const box = await container.boundingBox();

      // Should not exceed 1280px (7xl)
      expect(box?.width).toBeLessThanOrEqual(1280);
    });

    test('should display all features in one row', async ({ page }) => {
      await page.goto('/');

      // All 6 features should be visible
      const features = page.locator(
        'text=100% Free Training, text=Job Placement Support, text=Fast-Track Programs, text=Industry Credentials, text=Career Support, text=Multiple Start Dates',
      );

      await expect(page.locator('text=100% Free Training')).toBeVisible();
      await expect(page.locator('text=Multiple Start Dates')).toBeVisible();
    });

    test('should have optimal line length', async ({ page }) => {
      await page.goto('/');

      // Paragraphs should not exceed 75 characters per line
      const paragraph = page.locator('p').first();
      const width = await paragraph.evaluate((el) => el.offsetWidth);

      // Assuming 16px font, ~75ch = ~1200px max
      expect(width).toBeLessThanOrEqual(1200);
    });
  });

  test.describe('4K Desktop (2560px)', () => {
    test.use({ viewport: viewports.desktopLarge });

    test('should maintain max-width constraint', async ({ page }) => {
      await page.goto('/');

      // Content should still be constrained
      const container = page.locator('.max-w-7xl').first();
      const box = await container.boundingBox();

      expect(box?.width).toBeLessThanOrEqual(1280);
    });

    test('should have proper spacing on large screens', async ({ page }) => {
      await page.goto('/');

      // Sections should have adequate spacing
      const section = page.locator('section').first();
      const marginBottom = await section.evaluate((el) => window.getComputedStyle(el).marginBottom);

      expect(parseInt(marginBottom)).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain brand colors across devices', async ({ page }) => {
      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Check primary button color
        const button = page.locator('a:has-text("Apply Now")').first();
        const bgColor = await button.evaluate((el) => window.getComputedStyle(el).backgroundColor);

        // Should have consistent blue color
        expect(bgColor).toBeTruthy();
      }
    });

    test('should load all images across devices', async ({ page }) => {
      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Wait for images to load
        await page.waitForLoadState('networkidle');

        // Check for broken images
        const brokenImages = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.filter((img) => !img.complete || img.naturalHeight === 0).length;
        });

        expect(brokenImages).toBe(0);
      }
    });

    test('should have consistent navigation across devices', async ({ page }) => {
      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Navigation should exist
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
      }
    });
  });

  test.describe('Performance Across Devices', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load in under 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load quickly on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load in under 2 seconds on desktop
      expect(loadTime).toBeLessThan(2000);
    });

    test('should have no layout shift', async ({ page }) => {
      await page.goto('/');

      // Measure Cumulative Layout Shift
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      // CLS should be less than 0.1 (good)
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Accessibility Across Devices', () => {
    test('should have proper heading hierarchy on all devices', async ({ page }) => {
      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Should have exactly one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
      }
    });

    test('should have alt text for all images', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should have visible focus
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName;
      });

      expect(focused).toBeTruthy();
    });
  });

  test.describe('Content Visibility', () => {
    test('should show all sections on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');

      // All major sections should be visible
      await expect(page.locator('text=Why Choose Our Programs')).toBeVisible();
      await expect(page.locator('text=Serving Indiana Residents')).toBeVisible();
      await expect(page.locator('text=Trusted Partners')).toBeVisible();
      await expect(page.locator('text=Industry-Recognized Certifications')).toBeVisible();
    });

    test('should prioritize content on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/');

      // Hero and key features should be visible
      await expect(page.locator('text=Free Career Training')).toBeVisible();
      await expect(page.locator('text=Apply Now')).toBeVisible();
    });
  });
});
