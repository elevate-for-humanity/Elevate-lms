/**
 * scripts/verify-build-identity.cjs
 *
 * Fails if any forbidden build identity patterns are found.
 * Must pass before any production build.
 */

const fs = require('fs');

const forbidden = [
  { pattern: /serverActionVersion/, message: 'Forbidden serverActionVersion option' },
  { pattern: /GIT_SHA=unknown/, message: 'Forbidden GIT_SHA=unknown default in Dockerfile' },
  {
    pattern: /0000000000000000000000000000000000000000/,
    message: 'Forbidden all-zeros commit SHA',
  },
];

const targets = [
  'next.config.mjs',
  'apps/next.config.mjs',
  'apps/admin/next.config.mjs',
  'apps/lms/next.config.mjs',
  'apps/marketing/next.config.mjs',
  'Dockerfile.northflank-admin',
  'Dockerfile.northflank-lms',
  'Dockerfile.marketing',
].filter((f) => fs.existsSync(f));

let failed = false;

for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');

  for (const { pattern, message } of forbidden) {
    if (pattern.test(text)) {
      failed = true;
      console.error(`FORBIDDEN: ${message} in ${file}`);
    }
  }
}

if (failed) {
  console.error('Build identity verification FAILED — fix above errors before building.');
  process.exit(1);
}

console.log('PASS: Build identity configuration is clean.');
