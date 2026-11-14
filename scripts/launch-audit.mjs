#!/usr/bin/env node
import puppeteer from 'puppeteer';

const URL = process.argv[2];
if (!URL) {
  console.error('Usage: node scripts/launch-audit.mjs <url>');
  process.exit(1);
}

const isError = (t) => /error|exception|failed|hydration|chunk|unexpected|cannot read/i.test(t);

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err));
  });

  page.on('requestfailed', (req) => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });

  // IMPORTANT: don't hang forever
  page.setDefaultNavigationTimeout(45000);
  page.setDefaultTimeout(45000);

  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // Let client JS run a moment
  await page.waitForTimeout(4000);

  // Try to detect if Next.js app booted
  const bootCheck = await page.evaluate(() => {
    const hasNextData = !!document.querySelector('#__NEXT_DATA__');
    const hasAppRouter = !!document.querySelector('body');
    return { hasNextData, hasAppRouter, title: document.title };
  });

  // Pull key runtime clues
  const firstRed = consoleLogs.find((l) => l.type === 'error' || isError(l.text));

  // Screenshot
  await page.screenshot({ path: 'launch-audit.png', fullPage: true });

  await browser.close();

  const bad =
    pageErrors.length ||
    failedRequests.length ||
    consoleLogs.some((l) => l.type === 'error' || isError(l.text));

  process.exit(bad ? 2 : 0);
})();
