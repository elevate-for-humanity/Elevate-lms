import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.describe('Homepage', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Elevate for Humanity/);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto('/');

      // Check main nav links exist
      await expect(page.getByRole('link', { name: /programs/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
    });

    test('should have CTA buttons', async ({ page }) => {
      await page.goto('/');

      // Look for apply/get started buttons
      const ctaButton = page.getByRole('link', { name: /apply|get started|enroll/i }).first();
      await expect(ctaButton).toBeVisible();
    });
  });

  test.describe('Programs Page', () => {
    test('should display program listings', async ({ page }) => {
      await page.goto('/programs');
      await expect(page).toHaveTitle(/Programs/i);

      // Should have program cards
      const programCards = page.locator('[class*="card"], [class*="program"]');
      await expect(programCards.first()).toBeVisible();
    });

    test('should navigate to individual program', async ({ page }) => {
      await page.goto('/programs/healthcare');
      await expect(page.locator('h1')).toContainText(/healthcare/i);
    });
  });

  test.describe('Contact Form', () => {
    test('should display contact form', async ({ page }) => {
      await page.goto('/contact');

      // Check form fields exist
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/message/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/contact');

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|send/i });
      await submitButton.click();

      // Should show validation errors or not submit
      // Form should still be visible (not redirected)
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });
  });

  test.describe('Apply Page', () => {
    test('should display application form', async ({ page }) => {
      await page.goto('/apply');
      await expect(page).toHaveTitle(/Apply/i);

      // Check for form fields
      await expect(
        page.getByLabel(/first name/i).or(page.getByPlaceholder(/first name/i)),
      ).toBeVisible();
    });
  });

  test.describe('Authentication Pages', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should display signup page', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should have link to reset password', async ({ page }) => {
      await page.goto('/login');
      const resetLink = page.getByRole('link', { name: /forgot|reset/i });
      await expect(resetLink).toBeVisible();
    });
  });

  test.describe('Blog', () => {
    test('should display blog posts', async ({ page }) => {
      await page.goto('/blog');
      await expect(page).toHaveTitle(/Blog/i);

      // Should have blog post cards or articles
      const articles = page.locator('article, [class*="blog"], [class*="post"]');
      await expect(articles.first()).toBeVisible();
    });
  });

  test.describe('Store', () => {
    test('should display store page', async ({ page }) => {
      await page.goto('/store');
      await expect(page).toHaveTitle(/Store/i);
    });

    test('should have cart page', async ({ page }) => {
      await page.goto('/store/cart');
      await expect(page).toHaveURL(/cart/);
    });
  });

  test.describe('LMS', () => {
    test('should display LMS landing page', async ({ page }) => {
      await page.goto('/lms');
      await expect(page).toHaveTitle(/LMS|Learning/i);
    });

    test('should have courses page', async ({ page }) => {
      await page.goto('/lms/courses');
      await expect(page).toHaveURL(/courses/);
    });
  });

  test.describe('API Health', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.overall).toBe('pass');
    });
  });

  test.describe('Redirects', () => {
    test('/register should redirect to /signup', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveURL(/signup/);
    });

    test('/forgot-password should redirect to /reset-password', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page).toHaveURL(/reset-password/);
    });

    test('/for-employers should redirect to /employers', async ({ page }) => {
      await page.goto('/for-employers');
      await expect(page).toHaveURL(/employers/);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Page should load without horizontal scroll
      const body = page.locator('body');
      const bodyWidth = await body.evaluate((el) => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });
  });
});
