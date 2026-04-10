/**
 * Playwright walkthrough: employer application → onboarding → MOU → dashboard
 * Drives a real Chromium browser session against the live dev server.
 */
import { chromium } from 'playwright';

const BASE     = 'https://3000--019d6bd8-a016-7003-a79d-6992ce1b13a3.us-east-1-01.gitpod.dev';
const EMAIL    = 'emp-fresh-1775828277@elevate-demo.test';
const PASSWORD = 'ElevateDemo2026!';

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️ ';

let passed = 0, failed = 0;
const issues = [];

function check(label, cond, detail = '') {
  if (cond) {
    console.log(`  ${PASS} ${label}${detail ? '  [' + detail + ']' : ''}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label}${detail ? '  [' + detail + ']' : ''}`);
    failed++;
    issues.push(label + (detail ? ': ' + detail : ''));
  }
  return cond;
}

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/employer-${name}.png`, fullPage: false });
}

async function waitForNav(page, trigger, opts = {}) {
  await Promise.all([
    page.waitForURL(opts.url || /.*/, { timeout: 10000 }),
    trigger(),
  ]).catch(() => {});
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  });
  // Clear any cached state
  await context.clearCookies();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('='.repeat(65));
  console.log('  EMPLOYER ONBOARDING — REAL BROWSER WALKTHROUGH');
  console.log(`  ${BASE}`);
  console.log('='.repeat(65));

  // ── STEP 1: Login ────────────────────────────────────────────────
  console.log('\n[1] LOGIN');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await screenshot(page, '01-login');
  check('Login page loaded', page.url().includes('/login'), page.url());
  check('Email field present', await page.locator('input[type="email"], input[name="email"]').count() > 0);
  check('Password field present', await page.locator('input[type="password"]').count() > 0);

  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await screenshot(page, '02-login-filled');

  await Promise.all([
    page.waitForNavigation({ timeout: 12000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2000);
  await screenshot(page, '03-after-login');

  const afterLogin = page.url();
  console.log(`  → Redirected to: ${afterLogin.replace(BASE, '')}`);
  check('Not stuck on login after submit', !afterLogin.endsWith('/login'), afterLogin.replace(BASE, ''));

  // ── STEP 2: Should land on onboarding ───────────────────────────
  console.log('\n[2] POST-LOGIN REDIRECT');
  // If not already on onboarding, navigate there
  if (!afterLogin.includes('/onboarding/employer')) {
    await page.goto(`${BASE}/onboarding/employer`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }
  await screenshot(page, '04-onboarding-index');
  const onboardingUrl = page.url();
  console.log(`  → URL: ${onboardingUrl.replace(BASE, '')}`);
  check('Reached onboarding/employer (not redirected to login)', !onboardingUrl.includes('/login'), onboardingUrl.replace(BASE, ''));

  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`  → Page title: "${h1?.trim()}"`);
  check('Onboarding heading visible', !!h1?.trim());
  check('Hiring Needs step present', await page.locator('text=Hiring Needs').count() > 0);
  check('MOU step present', await page.locator('text=Partnership Agreement, text=employer-agreement').count() > 0
    || (await page.content()).includes('Partnership Agreement') || (await page.content()).includes('employer-agreement'));

  // ── STEP 3: Hiring needs ─────────────────────────────────────────
  console.log('\n[3] HIRING NEEDS FORM');
  // Click the Continue button for hiring-needs step
  const hiringLink = page.locator('a[href*="hiring-needs"]').first();
  if (await hiringLink.count() > 0) {
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      hiringLink.click(),
    ]);
  } else {
    await page.goto(`${BASE}/onboarding/employer/hiring-needs`, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(1500);
  await screenshot(page, '05-hiring-needs');
  const hnUrl = page.url();
  console.log(`  → URL: ${hnUrl.replace(BASE, '')}`);
  check('Hiring needs page loaded', hnUrl.includes('hiring-needs') && !hnUrl.includes('/login'), hnUrl.replace(BASE, ''));

  const hnH1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`  → Page title: "${hnH1?.trim()}"`);

  // Fill the form
  const industrySelect = page.locator('select').first();
  if (await industrySelect.count() > 0) {
    await industrySelect.selectOption({ index: 2 }); // pick second option
    check('Industry selected', true);
  } else {
    check('Industry selector found', false, 'no <select> on page');
  }

  // Pick a position type
  const positionBtn = page.locator('button[type="button"]').first();
  if (await positionBtn.count() > 0) {
    await positionBtn.click();
    check('Position type selected', true);
  }

  // Pick hiring timeline
  const timelineBtns = page.locator('button[type="button"]');
  const btnCount = await timelineBtns.count();
  if (btnCount > 1) {
    await timelineBtns.nth(Math.min(4, btnCount - 1)).click();
    check('Hiring timeline selected', true);
  }

  // Fill positions count
  const selects = page.locator('select');
  if (await selects.count() > 1) {
    await selects.nth(1).selectOption({ index: 1 });
    check('Positions count selected', true);
  }

  await screenshot(page, '06-hiring-needs-filled');

  // Submit
  const submitBtn = page.locator('button[type="submit"]');
  check('Submit button present', await submitBtn.count() > 0);
  if (await submitBtn.count() > 0) {
    await Promise.all([
      page.waitForNavigation({ timeout: 12000 }).catch(() => {}),
      submitBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    await screenshot(page, '07-after-hiring-needs');
    const afterHN = page.url();
    console.log(`  → After submit: ${afterHN.replace(BASE, '')}`);
    check('Navigated away from hiring-needs after submit',
      !afterHN.includes('hiring-needs'), afterHN.replace(BASE, ''));
  }

  // ── STEP 4: Back on onboarding index ────────────────────────────
  console.log('\n[4] ONBOARDING INDEX — after hiring needs');
  if (!page.url().includes('/onboarding/employer') || page.url().includes('hiring')) {
    await page.goto(`${BASE}/onboarding/employer`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }
  await screenshot(page, '08-onboarding-after-hiring');
  const content4 = await page.content();
  // Step 1 should now show "Done"
  check('Step 1 (Hiring Needs) marked complete', content4.includes('Done') || content4.includes('complete'));
  // MOU step should now be unlocked (has a Continue/Review & Sign button)
  check('MOU step unlocked (Continue button visible)',
    await page.locator('a[href*="employer-agreement"]').count() > 0
    || await page.locator('text=Review & Sign').count() > 0
    || await page.locator('text=Continue').count() > 0);

  // ── STEP 5: MOU sign ────────────────────────────────────────────
  console.log('\n[5] EMPLOYER AGREEMENT (MOU)');
  const mouLink = page.locator('a[href*="employer-agreement"]').first();
  if (await mouLink.count() > 0) {
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      mouLink.click(),
    ]);
  } else {
    await page.goto(`${BASE}/legal/employer-agreement`, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(1500);
  await screenshot(page, '09-mou');
  const mouUrl = page.url();
  console.log(`  → URL: ${mouUrl.replace(BASE, '')}`);
  check('MOU page loaded', mouUrl.includes('employer-agreement') && !mouUrl.includes('/login'), mouUrl.replace(BASE, ''));

  const mouH1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`  → Page title: "${mouH1?.trim()}"`);
  check('Agreement content visible', (await page.content()).toLowerCase().includes('agreement'));

  // Wait for the signature block to finish loading (useEffect resolves auth + DB check).
  // It either shows the form (input visible) or the already-signed banner.
  // The useEffect can take 3-5s on the Gitpod preview proxy.
  await page.locator('input[placeholder*="name"], :text("already signed"), :text("signature is on file")').first()
    .waitFor({ timeout: 8000 }).catch(() => {});

  // Check which state rendered
  const pageText = await page.locator('body').innerText().catch(() => '');
  const isAlreadySigned = pageText.includes('already signed') || pageText.includes('signature is on file');

  if (isAlreadySigned) {
    console.log('  → Agreement already signed — banner shown, skipping form');
    check('MOU signed (already on file)', true, 'prior signature found');
  } else {
    // Fill name
    const sigInput = page.locator('input[placeholder*="name"]').first();
    if (await sigInput.count() > 0) {
      await sigInput.fill('Dana Employer');
      check('Signature typed', true);
    } else {
      check('Signature input found', false, 'no text input found');
    }

    // Check acknowledgment checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0 && !(await checkbox.isChecked())) {
      await checkbox.check();
    }

    await screenshot(page, '10-mou-filled');

    const signBtn = page.locator('button:has-text("Sign &"), button[type="submit"]').first();
    check('Sign button present', await signBtn.count() > 0);
    if (await signBtn.count() > 0) {
      // Signing uses a Server Action — wait for navigation away from the page
      await signBtn.click();
      const redirected = await page.waitForURL(url => !url.includes('employer-agreement'), { timeout: 8000 })
        .then(() => true).catch(() => false);

      await screenshot(page, '11-after-mou');
      const afterMOU = page.url();
      console.log(`  → After sign: ${afterMOU.replace(BASE, '')}`);
      check('Redirected after signing MOU', redirected, afterMOU.replace(BASE, ''));
    }
  }

  // ── STEP 6: Onboarding index — steps 1+2 complete ───────────────
  console.log('\n[6] ONBOARDING INDEX — after MOU');
  if (!page.url().includes('/onboarding/employer')) {
    await page.goto(`${BASE}/onboarding/employer`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }
  await screenshot(page, '12-onboarding-after-mou');
  const content6 = await page.content();
  const doneCount = (content6.match(/Done/g) || []).length;
  console.log(`  → Steps marked Done: ${doneCount}`);
  check('At least 2 steps complete', doneCount >= 2, `${doneCount} Done badges`);

  // ── STEP 7: Orientation ──────────────────────────────────────────
  console.log('\n[7] ORIENTATION');
  await page.goto(`${BASE}/onboarding/employer/orientation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '13-orientation');
  const orientUrl = page.url();
  console.log(`  → URL: ${orientUrl.replace(BASE, '')}`);
  check('Orientation page loaded', orientUrl.includes('orientation') && !orientUrl.includes('/login'), orientUrl.replace(BASE, ''));
  const orientH1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`  → Page title: "${orientH1?.trim()}"`);

  // ── STEP 8: Employer dashboard ───────────────────────────────────
  console.log('\n[8] EMPLOYER DASHBOARD');
  await page.goto(`${BASE}/employer/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await screenshot(page, '14-dashboard');
  const dashUrl = page.url();
  console.log(`  → URL: ${dashUrl.replace(BASE, '')}`);
  check('Employer dashboard loaded (not login)', !dashUrl.includes('/login'), dashUrl.replace(BASE, ''));
  const dashH1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`  → Page title: "${dashH1?.trim()}"`);
  check('Dashboard has content', !!dashH1?.trim());

  // ── Console errors ───────────────────────────────────────────────
  if (consoleErrors.length > 0) {
    console.log(`\n  ${WARN} Browser console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach(e => console.log(`       ${e.slice(0, 120)}`));
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(65));
  console.log(`  RESULT: ${passed} passed, ${failed} failed`);
  if (issues.length) {
    console.log('\n  Issues:');
    issues.forEach(i => console.log(`  ${FAIL} ${i}`));
  }
  console.log('='.repeat(65));

  // Save screenshots list
  console.log('\n  Screenshots saved to /tmp/employer-*.png');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
