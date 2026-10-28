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
  await page.getByRole('button', { name: 'Add training', exact: true }).click();
  await page.getByLabel('Program or qualification').fill('QA Workforce Training');
  await page.getByLabel('School or training provider').fill('QA Training Provider');
  await page.getByLabel('Skill to add').fill('Customer service');
  await page.getByRole('button', { name: 'Add skill', exact: true }).click();
  await page.getByRole('button', { name: 'Add credential', exact: true }).click();
  await page.getByLabel('Credential name', { exact: true }).fill('QA Earned Credential');
  await page.getByLabel('Issued by', { exact: true }).fill('QA Credential Provider');
  await page.getByRole('button', { name: 'Save Resume' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Resume saved.' })).toBeVisible();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByPlaceholder('Full Name')).toHaveValue('QA Career Resume');
  await expect(page.getByLabel('Program or qualification')).toHaveValue('QA Workforce Training');
  await expect(page.getByLabel('Credential name', { exact: true })).toHaveValue('QA Earned Credential');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('region', { name: 'Resume preview' })).toContainText('QA Workforce Training');
  await expect(page.getByRole('region', { name: 'Resume preview' })).toContainText('QA Earned Credential');
  await expect(page.getByRole('region', { name: 'Resume preview' })).toContainText('Customer service');
  await expect(page.getByRole('region', {name:'Resume preview'})).toContainText('Verified student resume persistence test.');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/-resume\.pdf$/);
  expect((await file.path())).toBeTruthy();
});


test('learner can launch Job Ready and reopen saved SCORM state', async ({ page }) => {
  test.setTimeout(120000);
  expect(EMAIL, 'Disposable learner account must be provisioned').toBeTruthy();
  expect(PASSWORD, 'Disposable learner password must be provisioned').toBeTruthy();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await Promise.all([
    page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.goto(BASE + '/lms/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Your Career Plan', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Open Job Ready', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Job Ready Indy', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start module', exact: true })).toHaveCount(7);
  await expect(page.getByText('Facilitation Resources', { exact: true })).toHaveCount(0);
  const providerFailures: number[] = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'document' && new URL(response.url()).hostname.endsWith('contentcontroller.com') && response.status() >= 400) providerFailures.push(response.status());
  });
  await page.getByRole('link', { name: 'Start module', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Introduction to Job Ready Indy', exact: true })).toBeVisible();
  await expect(page.locator('iframe[title="Introduction to Job Ready Indy"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).API_1484_11?.GetValue('cmi.learner_id') || ''), { timeout: 45000 }).not.toBe('');
  // The hosted course must actually open, not only the local dispatch shell.
  await expect.poll(() => page.frames().filter(frame => {
    try { return new URL(frame.url()).hostname.endsWith('contentcontroller.com'); } catch { return false; }
  }).length, { timeout: 45000 }).toBeGreaterThan(0);
  expect(providerFailures, 'Provider document requests must succeed').toEqual([]);
  const marker = 'Disposable QA state persistence check';
  const savedResponse = page.waitForResponse(response => response.url().includes('/api/learner/job-ready/introduction') && (response.request().postData() || '').includes(marker));
  expect(await page.evaluate(value => {
    const api = (window as any).API_1484_11;
    if (api.SetValue('cmi.comments_from_learner.0.comment', value) !== 'true') return 'false';
    return api.Commit('');
  }, marker)).toBe('true');
  const saved = await savedResponse;
  expect(saved.status(), await saved.text()).toBe(200);
  await expect(page.getByText('Progress saved. You can return to this module later.', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => (window as any).API_1484_11?.GetValue('cmi.comments_from_learner.0.comment') || ''), { timeout: 45000 }).toBe(marker);
});
