#!/usr/bin/env node
import fs from 'node:fs';

const files = [
  "scripts/verify-full-site.js",
  "public/.well-known/change-password",
  "scripts/add-meta-tags.cjs",
  "scripts/utilities/deployment-monitor.js",
  "scripts/utilities/flash-sale-checkout.js",
  "scripts/performance-optimizer.js",
  "scripts/smoke-routes.ts",
  "scripts/utilities/stripe-partner-products-setup.js",
  "lib/email/templates/onboarding.ts",
  "lib/chatbot/tidio-config.ts",
  "scripts/seo-setup.cjs",
  "scripts/utilities/dual-certificate-system.js",
  "lib/domain/certificates.ts",
  "scripts/inject-meta.js",
  "apps/admin/app/api/credentialing/route.ts",
  "scripts/utilities/automated-enrollment-system.js",
  "scripts/utilities/revenue-split-system.js",
  "scripts/routing-guardian.sh",
  "scripts/social-media-automation.js",
  "scripts/analyze-marketing-site.js",
  "apps/lms/app/api/ai/build-remote/route.ts",
  "scripts/utilities/blog-system.js",
  "scripts/puppeteer-extract-css.js",
  "lib/email/career-course-sequences.ts",
  "scripts/utilities/enhanced-meta-tags-updater.js",
  "lib/curriculum/lesson-contract.schema.json"
];
const bareOrigin = /https:\/\/elevateforhumanity\.org(?=\/|['"`]|$)/g;
const failures = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(bareOrigin)];
  if (matches.length > 0) {
    failures.push(`${file}: ${matches.length} bare-domain URL(s)`);
  }
}

if (failures.length > 0) {
  console.error(
    [
      'Public URL canonicalization failed.',
      'Use https://www.elevateforhumanity.org for links that are published to users.',
      ...failures,
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`Canonical public URL check passed for ${files.length} files.`);
