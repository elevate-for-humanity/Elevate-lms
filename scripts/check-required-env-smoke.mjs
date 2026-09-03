#!/usr/bin/env node

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalButRecommended = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
];

const missing = required.filter((k) => !process.env[k]);
const missingRecommended = optionalButRecommended.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error('❌ Missing required env for smoke/e2e:');
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error('Set these env vars before running smoke tests.');
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn('⚠️ Missing recommended env vars (non-blocking for base smoke):');
  missingRecommended.forEach((k) => console.warn(`   - ${k}`));
}

console.log('✅ Required smoke/e2e env vars are present.');
