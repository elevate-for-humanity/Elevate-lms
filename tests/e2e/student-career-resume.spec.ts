import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const EMAIL = process.env.E2E_LEARNER_EMAIL || '';
const PASSWORD = process.env.E2E_LEARNER_PASSWORD || '';

test('student can access Career Services, save, reopen, preview and download resume', async ({ page }) => {
  expect(EMAIL, 'Disposable learner account must be provisioned').toBeTruthy();
  expect(PASSWORD, 'Disposable learner password must be provisioned').toBeTruthy();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();
  await expect(email).toBeEnabled();
  await expect(password).toBeEnabled();
  await email.fill(EMAIL);
  await password.fill(PASSWORD);
  await expect(submit).toBeEnabled();
  await Promise.all([
    page.waitForURL(url => !url.pathname.includes('/login'), {timeout:30000}),
    submit.click(),
  ]);
  await page.goto(BASE + '/lms/career', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Career Services' })).toBeVisible();
  const resumeLink = page.getByRole('link', { name: 'Open Resume Builder' });
  await expect(resumeLink).toBeVisible();
  await resumeLink.click();
  await expect(page.getByRole('heading', { name: 'Build your professional resume' })).toBeVisible();
  const name = page.getByPlaceholder('Full Name');
  await name.fill('QA Career Resume');
  await page.getByPlaceholder('Email').fill('qa-career@example.invalid');
  await page.getByPlaceholder('Write a brief summary of your professional background and career goals...').fill('Verified student resume persistence test.');
  await page.getByRole('button', { name: 'Save Resume' }).click();
  await expect(page.getByRole('status')).toContainText('Resume saved.');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByPlaceholder('Full Name')).toHaveValue('QA Career Resume');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('region', {name:'Resume preview'})).toContainText('Verified student resume persistence test.');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/-resume\.pdf$/);
  expect((await file.path())).toBeTruthy();
});
