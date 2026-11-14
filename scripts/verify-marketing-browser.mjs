import { chromium } from 'playwright';
import { waitForStableMarketingVersion } from './verify-marketing-version.mjs';

const expectedSha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(expectedSha ?? '')) {
  throw new Error('Expected the exact 40-character deployment SHA.');
}

const base = 'https://www.elevateforhumanity.org';
const browser = await chromium.launch({ headless: true });

try {
  const versionPage = await browser.newPage({
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache, no-store',
      Pragma: 'no-cache',
    },
  });
  try {
    await waitForStableMarketingVersion({
      expectedSha,
      readVersion: async (attempt) => {
        const versionUrl = new URL('/api/version', base);
        versionUrl.searchParams.set('deploy', expectedSha);
        versionUrl.searchParams.set(
          'browser-attempt',
          `${process.env.GITHUB_RUN_ID ?? 'local'}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}-${attempt}`,
        );

        const response = await versionPage.goto(versionUrl.toString(), {
          waitUntil: 'commit',
          timeout: 20000,
        });
        const payload = await response?.json().catch(() => null);
        return {
          ok: response?.ok() ?? false,
          status: response?.status() ?? 0,
          commitSha: typeof payload?.commitSha === 'string' ? payload.commitSha : '',
        };
      },
      onSample: ({
        attempt,
        maxAttempts,
        consecutiveMatches,
        requiredConsecutiveMatches,
        description,
      }) => {
        console.log(
          `Marketing version attempt ${attempt}/${maxAttempts}: ${description}; stable matches ${consecutiveMatches}/${requiredConsecutiveMatches}`,
        );
      },
    });
  } finally {
    await versionPage.close();
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
      if (
        /Application error: a client-side exception|A client-side error occurred while loading/.test(
          content,
        )
      ) {
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
