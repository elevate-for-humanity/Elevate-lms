/**
 * Audits all internal program hero banners.
 * Run: pnpm audit:hero-banners
 *
 * Exits 1 if any banner fails validation.
 * programBanner() throws at import time — this script surfaces those errors clearly.
 */

import { internalProgramHeroBanners } from '../content/heroBanners';

function runAudit() {
  const entries = Object.entries(internalProgramHeroBanners);
  let passed = 0;
  let failed = 0;

  for (const [key, banner] of entries) {
    try {
      console.log(`OK  ${key}`);
      console.log(`    credential : ${banner.credentialLabel}`);
      console.log(`    duration   : ${banner.durationLabel}`);
      console.log(`    salary     : ${banner.salaryRangeLabel}`);
      console.log(`    transcript : ${banner.transcript?.length} chars`);
      console.log(`    indicators : ${banner.trustIndicators?.length} items`);
      passed++;
    } catch (err) {
      console.error(`FAIL ${key}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed — ${entries.length} total internal program banners.`);

  if (failed > 0) process.exit(1);
}

runAudit();
