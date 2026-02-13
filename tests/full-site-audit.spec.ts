import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Critical pages that must work perfectly
const criticalPages = [
  { path: '/', name: 'Homepage', mustHave: ['Free Career Training', 'Apply Now'] },
  { path: '/programs', name: 'Programs', mustHave: ['Programs', 'Healthcare'] },
  { path: '/programs/healthcare', name: 'Healthcare Programs', mustHave: ['Healthcare', 'CNA'] },
  { path: '/programs/skilled-trades', name: 'Skilled Trades', mustHave: ['Skilled Trades', 'HVAC'] },
  { path: '/programs/technology', name: 'Technology', mustHave: ['Technology'] },
  { path: '/programs/business', name: 'Business', mustHave: ['Business'] },
  { path: '/apply', name: 'Apply Page', mustHave: ['Apply', 'Application'] },
  { path: '/about', name: 'About Page', mustHave: ['About', 'Elevate'] },
  { path: '/contact', name: 'Contact Page', mustHave: ['Contact'] },
  { path: '/wioa-eligibility', name: 'WIOA Eligibility', mustHave: ['WIOA', 'Eligibility'] },
  { path: '/career-services', name: 'Career Services', mustHave: ['Career'] },
  { path: '/blog', name: 'Blog', mustHave: ['Blog'] },
  { path: '/support', name: 'Support', mustHave: ['Support', 'Help'] },
  { path: '/support/ticket', name: 'Support Ticket', mustHave: ['Ticket', 'Submit'] },
  { path: '/support/help', name: 'Help Center', mustHave: ['Help'] },
  { path: '/login', name: 'Login', mustHave: ['Login', 'Sign'] },
  { path: '/signup', name: 'Signup', mustHave: ['Sign Up', 'Create'] },
  { path: '/privacy-policy', name: 'Privacy Policy', mustHave: ['Privacy'] },
  { path: '/terms-of-service', name: 'Terms of Service', mustHave: ['Terms'] },
  { path: '/accessibility', name: 'Accessibility', mustHave: ['Accessibility'] },
  { path: '/federal-compliance', name: 'Federal Compliance', mustHave: ['Compliance'] },
  { path: '/equal-opportunity', name: 'Equal Opportunity', mustHave: ['Equal Opportunity'] },
  { path: '/grievance', name: 'Grievance', mustHave: ['Grievance'] },
  { path: '/ferpa', name: 'FERPA', mustHave: ['FERPA'] },
];

// All program pages
const programPages = [
  '/programs/healthcare',
  '/programs/skilled-trades', 
  '/programs/technology',
  '/programs/business',
  '/programs/cdl-transportation',
  '/programs/barber-apprenticeship',
  '/programs/cna',
  '/programs/tax-preparation',
];

// Service pages
const servicePages = [
  '/career-services',
  '/career-services/job-placement',
  '/career-services/resume-building',
  '/career-services/interview-prep',
  '/advising',
  '/mentorship',
  '/supersonic-fast-cash',
  '/vita',
];

test.describe('Full Site Audit - Critical Pages', () => {
  for (const page of criticalPages) {
    test(`${page.name} (${page.path}) loads correctly`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(`${BASE_URL}${page.path}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Check HTTP status
      expect(response?.status()).toBeLessThan(400);
      
      // Check page has content
      const bodyText = await browserPage.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(100);
      
      // Check for required content
      for (const text of page.mustHave) {
        const hasText = await browserPage.getByText(text, { exact: false }).first().isVisible().catch(() => false);
        if (!hasText) {
          // Try case-insensitive search in body
          const bodyLower = bodyText!.toLowerCase();
          expect(bodyLower).toContain(text.toLowerCase());
        }
      }
      
      // Check no error messages visible
      const errorVisible = await browserPage.locator('text=/error|500|404|something went wrong/i').first().isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await browserPage.locator('text=/error|500|404|something went wrong/i').first().textContent();
        console.warn(`Warning: Possible error on ${page.path}: ${errorText}`);
      }
      
      // Check header exists
      const header = await browserPage.locator('header').first().isVisible().catch(() => false);
      expect(header).toBeTruthy();
      
      // Check footer exists
      const footer = await browserPage.locator('footer').first().isVisible().catch(() => false);
      expect(footer).toBeTruthy();
    });
  }
});

test.describe('Program Pages - No Duplicate Heroes', () => {
  for (const path of programPages) {
    test(`${path} has single hero section`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      
      // Count hero sections (video banners or hero sections)
      const heroSections = await page.locator('section').filter({ 
        has: page.locator('h1') 
      }).count();
      
      // Count video hero banners specifically
      const videoHeroes = await page.locator('video').count();
      
      // Should have at most 1 video hero
      expect(videoHeroes).toBeLessThanOrEqual(1);
      
      // Check for duplicate h1 tags (bad for SEO)
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeLessThanOrEqual(2); // Allow breadcrumb + main h1
    });
  }
});

test.describe('Navigation Links', () => {
  test('All main navigation links work', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const navLinks = [
      '/programs',
      '/apply', 
      '/about',
      '/contact',
      '/support',
    ];
    
    for (const link of navLinks) {
      const response = await page.goto(`${BASE_URL}${link}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
    }
  });
  
  test('All footer links work', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const footerLinks = [
      '/privacy-policy',
      '/terms-of-service',
      '/accessibility',
      '/sitemap-page',
    ];
    
    for (const link of footerLinks) {
      const response = await page.goto(`${BASE_URL}${link}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
    }
  });
});

test.describe('Forms', () => {
  test('Apply form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply`, { waitUntil: 'domcontentloaded' });
    
    // Check form exists
    const form = await page.locator('form').first().isVisible();
    expect(form).toBeTruthy();
    
    // Check required fields exist
    const nameField = await page.locator('input[name="firstName"], input[name="name"], input[placeholder*="name" i]').first().isVisible().catch(() => false);
    const emailField = await page.locator('input[type="email"], input[name="email"]').first().isVisible().catch(() => false);
    
    expect(nameField || emailField).toBeTruthy();
  });
  
  test('Contact form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });
    
    // Check for contact information or form
    const hasContactInfo = await page.getByText(/317|email|phone/i).first().isVisible().catch(() => false);
    expect(hasContactInfo).toBeTruthy();
  });
  
  test('Support ticket form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/support/ticket`, { waitUntil: 'domcontentloaded' });
    
    // Check form exists
    const form = await page.locator('form').first().isVisible();
    expect(form).toBeTruthy();
    
    // Check submit button exists
    const submitBtn = await page.locator('button[type="submit"]').first().isVisible();
    expect(submitBtn).toBeTruthy();
  });
});

test.describe('SEO Requirements', () => {
  for (const pageDef of criticalPages.slice(0, 10)) {
    test(`${pageDef.name} has proper SEO elements`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
      
      // Check title exists and is not empty
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      
      // Check meta description
      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDesc).toBeTruthy();
      
      // Check h1 exists
      const h1 = await page.locator('h1').first().isVisible();
      expect(h1).toBeTruthy();
    });
  }
});

test.describe('Accessibility Basics', () => {
  test('Homepage has skip link', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const skipLink = await page.locator('a[href="#main-content"], .skip-to-main').first().isVisible().catch(() => false);
    // Skip link might be visually hidden but present
    const skipLinkExists = await page.locator('a[href="#main-content"], .skip-to-main').count();
    expect(skipLinkExists).toBeGreaterThan(0);
  });
  
  test('Images have alt text', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const images = await page.locator('img').all();
    for (const img of images.slice(0, 10)) { // Check first 10 images
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (src && !src.includes('data:')) {
        expect(alt !== null, `Image ${src} missing alt text`).toBeTruthy();
      }
    }
  });
});

test.describe('Performance', () => {
  test('Homepage loads in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    // Should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
    console.log(`Homepage load time: ${loadTime}ms`);
  });
});
