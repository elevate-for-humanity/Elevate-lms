import { chromium } from 'playwright';

const expectedSha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(expectedSha ?? '')) {
  throw new Error('Expected the exact 40-character deployment SHA.');
}

const base = 'https://www.elevateforhumanity.org';
const browser = await chromium.launch({ headless: true });

try {
  const version = await (await browser.newPage()).goto(`${base}/api/version`);
  if (!version?.ok() || (await version.json()).commitSha !== expectedSha) {
    throw new Error('Live Marketing version does not match the deployed commit.');
  }

  for (const pathname of ['/', '/programs/barber-apprenticeship']) {
    const page = await browser.newPage();
    const failures = [];
    page.on('pageerror', (error) => failures.push(error.message));

    try {
      const response = await page.goto(`${base}${pathname}?browser-smoke=${expectedSha}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await page.waitForTimeout(2500);
      const content = await page.locator('body').innerText();
      if (!response?.ok()) failures.push(`HTTP ${response?.status() ?? 'unknown'}`);
      if (/Application error: a client-side exception|A client-side error occurred while loading/.test(content)) {
        failures.push('Client-side application error is visible.');
      }
      if (!content.trim()) failures.push('The hydrated page is empty.');
      if (failures.length) throw new Error(`${pathname}: ${failures.join('; ')}`);
      console.log(`Hydrated Marketing page verified: ${pathname}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
