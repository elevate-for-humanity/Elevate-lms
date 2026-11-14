/**
 * Comprehensive admin + marketing site E2E test
 */
import { chromium } from 'playwright';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || '';
const EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@elevateforhumanity.org';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
if (!PASSWORD) { console.error('E2E_ADMIN_PASSWORD env var is required'); process.exit(1); }

const results = [];
const pass = (n, d = '') => {
  results.push({ s: '✅', n, d });
  console.log('  ✅', n, d ? `— ${d}` : '');
};
const fail = (n, d = '') => {
  results.push({ s: '❌', n, d });
  console.log('  ❌', n, d ? `— ${d}` : '');
};
const warn = (n, d = '') => {
  results.push({ s: '⚠️', n, d });
  console.log('  ⚠️ ', n, d ? `— ${d}` : '');
};

async function noChrome(page, label) {
  // Wait briefly for MarketingChromeGuard useEffect to run after hydration
  await page.waitForTimeout(300);
  const visible = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-marketing-chrome]')).some(
      (el) => window.getComputedStyle(el).display !== 'none',
    ),
  );
  visible
    ? fail(`Marketing chrome hidden on ${label}`)
    : pass(`Marketing chrome hidden on ${label}`);
}

async function api(page, method, path, body, okStatuses, label) {
  const r = await page.request.fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { data: JSON.stringify(body) } : {}),
  });
  const s = r.status();
  const j = await r.json().catch(() => ({}));
  okStatuses.includes(s)
    ? pass(label, `${s} ${JSON.stringify(j).slice(0, 60)}`)
    : fail(label, `${s} ${JSON.stringify(j).slice(0, 80)}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    // 1. MARKETING SITE
    console.log('\n── MARKETING SITE ──');
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    pass('Homepage loads');

    const vid = await page.$('video');
    if (vid) {
      const src = (await vid.getAttribute('src')) ?? '';
      src.includes('r2.dev')
        ? pass('Hero video → R2 CDN', src.split('/').pop())
        : fail('Hero video → local stub', src);
    } else {
      fail('Hero video', 'no <video> element');
    }

    // Check marketing chrome is present and not hidden (fixed header has 0 computed height so use display check)
    const mktHdr = await page.$('[data-marketing-chrome]');
    const mktHdrDisplay = mktHdr
      ? await mktHdr.evaluate((el) => window.getComputedStyle(el).display)
      : 'none';
    mktHdr && mktHdrDisplay !== 'none'
      ? pass('Marketing header present on homepage')
      : warn('Marketing header', 'not found or hidden');

    await page.goto(`${BASE}/lms/programs`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const items = await page.$$('a[href*="/lms/"], a[href*="/programs/"]');
    items.length > 0
      ? pass('Programs page renders', `${items.length} links`)
      : warn('Programs page', 'no links found');

    const barber = await page.goto(`${BASE}/programs/barber-apprenticeship`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    barber?.status() === 200
      ? pass('Barber program page — 200')
      : fail('Barber program page', `${barber?.status()}`);

    // /apply is a landing page with links to /apply/student, /apply/program-holder, etc.
    await page.goto(`${BASE}/apply`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const applyStudentLink = await page.$('a[href*="/apply/student"]');
    applyStudentLink
      ? pass('Apply page — student link present')
      : warn('Apply page', 'no student apply link');

    // 2. LOGIN
    console.log('\n── LOGIN ──');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
    });
    await page.evaluate(() => {
      const b = document.querySelector('button[type="submit"]');
      if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForURL(/\/(my-dashboard|admin|learner)/, { timeout: 20000 });
    const postLogin = page.url();
    if (postLogin.includes('/login')) {
      fail('Login', 'still on login');
      await browser.close();
      return;
    }
    pass('Login succeeded', postLogin.replace(BASE, ''));

    // 3. ADMIN DASHBOARD
    console.log('\n── ADMIN DASHBOARD ──');
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const dashUrl = page.url();
    dashUrl.includes('/login') || dashUrl.includes('/unauthorized')
      ? fail('Admin dashboard', `redirected to ${dashUrl.replace(BASE, '')}`)
      : pass('Admin dashboard accessible');
    await noChrome(page, '/admin/dashboard');
    const nav = await page.$('nav, aside');
    nav ? pass('Admin nav present') : warn('Admin nav', 'not found');
    const cards = await page.$$('h1,h2,h3,[class*="stat"],[class*="card"]');
    pass('Dashboard content', `${cards.length} elements`);

    // 4. APPLICATIONS
    console.log('\n── APPLICATIONS ──');
    await page.goto(`${BASE}/admin/applications`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    if (page.url().includes('/login')) {
      fail('Applications list', 'redirected');
    } else {
      pass('Applications list accessible');
      await noChrome(page, '/admin/applications');
      const rows = await page.$$('tbody tr');
      rows.length > 0
        ? pass('Applications table', `${rows.length} rows`)
        : warn('Applications table', 'no rows');

      // Only match links inside the table body that point to /admin/applications/review/
      const link = await page.$(
        'tbody a[href*="/admin/applications/review/"], tbody a[href*="/review/"]',
      );
      if (link) {
        const href = await link.getAttribute('href');
        await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (!page.url().includes('/login')) {
          pass('Application review page loads');
          await noChrome(page, 'application review');
          const approveBtn = await page.$('button:has-text("Approve")');
          const rejectBtn = await page.$('button:has-text("Reject")');
          approveBtn ? pass('Approve button present') : warn('Approve button', 'not found');
          rejectBtn ? pass('Reject button present') : warn('Reject button', 'not found');
        } else {
          fail('Application review', 'redirected to login');
        }
      } else {
        warn('Application review', 'no view link in table');
      }
    }

    // 5. APPLICATION API
    console.log('\n── APPLICATION API ──');
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const fakeId = '00000000-0000-0000-0000-000000000001';
    await api(
      page,
      'GET',
      `/api/admin/applications/${fakeId}`,
      null,
      [404],
      'GET /api/admin/applications/[id]',
    );
    await api(
      page,
      'PATCH',
      `/api/admin/applications/${fakeId}`,
      { status: 'in_review' },
      [404],
      'PATCH /api/admin/applications/[id]',
    );
    await api(
      page,
      'POST',
      '/api/admin/applications/transition',
      { application_id: fakeId, next_status: 'in_review' },
      [400, 404, 422],
      'POST /api/admin/applications/transition',
    );
    await api(
      page,
      'POST',
      `/api/admin/applications/${fakeId}/approve`,
      { program_id: null },
      [400, 404],
      'POST /api/admin/applications/[id]/approve',
    );

    // 6. PROGRAM HOLDERS
    console.log('\n── PROGRAM HOLDERS ──');
    await page.goto(`${BASE}/admin/program-holders`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    if (page.url().includes('/login') || page.url().includes('/unauthorized')) {
      fail('Program holders list', `redirected to ${page.url().replace(BASE, '')}`);
    } else {
      pass('Program holders list accessible');
      await noChrome(page, '/admin/program-holders');
      const phRows = await page.$$('tbody tr');
      phRows.length > 0
        ? pass('Program holders table', `${phRows.length} rows`)
        : warn('Program holders table', 'no rows');
    }
    await page.goto(`${BASE}/admin/program-holders/verification`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    page.url().includes('/login')
      ? fail('Verification queue', 'redirected')
      : pass('Verification queue accessible');

    // 7. OTHER ADMIN SECTIONS
    console.log('\n── OTHER ADMIN SECTIONS ──');
    for (const p of [
      '/admin/students',
      '/admin/programs',
      '/admin/certificates',
      '/admin/reports',
    ]) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      page.url().includes('/login') || page.url().includes('/unauthorized')
        ? fail(`${p}`, 'redirected')
        : pass(`${p} accessible`);
    }

    // 8. MARKETING AFTER LOGIN
    console.log('\n── MARKETING AFTER LOGIN ──');
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const mktAfter = await page.$('[data-marketing-chrome]');
    const mktAfterDisplay = mktAfter
      ? await mktAfter.evaluate((el) => window.getComputedStyle(el).display)
      : 'none';
    mktAfter && mktAfterDisplay !== 'none'
      ? pass('Marketing header present after login')
      : warn('Marketing header after login', 'not found or hidden');
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await noChrome(page, '/admin/dashboard after marketing visit');

    // 9. JS ERRORS
    console.log('\n── JS ERRORS ──');
    const real = pageErrors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR'));
    real.length === 0
      ? pass('No JS page errors')
      : fail('JS page errors', real.slice(0, 2).join(' | '));
  } catch (err) {
    fail('Test runner', err.message);
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.s === '✅').length;
  const failed = results.filter((r) => r.s === '❌').length;
  const warned = results.filter((r) => r.s === '⚠️').length;
  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed  ${failed} failed  ${warned} warnings`);
  console.log('═'.repeat(60));
  if (failed > 0) {
    console.log('\nFAILURES:');
    results
      .filter((r) => r.s === '❌')
      .forEach((r) => console.log(`  ❌ ${r.n}${r.d ? ' — ' + r.d : ''}`));
  }
  if (warned > 0) {
    console.log('\nWARNINGS:');
    results
      .filter((r) => r.s === '⚠️')
      .forEach((r) => console.log(`  ⚠️  ${r.n}${r.d ? ' — ' + r.d : ''}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
