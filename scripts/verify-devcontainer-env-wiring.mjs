#!/usr/bin/env node
/**
 * Verifies dev container / Google Cloud Run env wiring — no fake credentials in UI paths.
 * Run: node scripts/verify-devcontainer-env-wiring.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function fail(msg) {
  console.error(`❌ ${msg}`);
  failed += 1;
}
function ok(msg) {
  console.info(`✅ ${msg}`);
}

const envExample = readFileSync(join(root, '.env.required.example'), 'utf8');
const requiredGoogleKeys = ['GOOGLE_CLOUD_PROJECT', 'GCP_PROJECT', 'K_SERVICE'];
const missingGoogleKeys = requiredGoogleKeys.filter((key) => !envExample.includes(`${key}=`));
if (missingGoogleKeys.length) {
  fail(`.env.required.example is missing Google runtime keys: ${missingGoogleKeys.join(', ')}`);
} else {
  ok('Google runtime environment declarations are documented');
}

const devPanel = readFileSync(join(root, 'components/studio/DevContainerPanel.tsx'), 'utf8');
if (devPanel.includes("'https://staging.${PLATFORM_DEFAULTS")) {
  fail('DevContainerPanel staging preset still has broken literal ${...} URLs');
} else {
  ok('DevContainerPanel staging preset uses real template literals');
}

const policy = JSON.parse(readFileSync(join(root, 'config/google-runtime-policy.json'), 'utf8'));
const components = ['admin', 'lms', 'marketing', 'store'];
for (const component of components) {
  const runtime = policy.components[component];
  if (
    !runtime?.service ||
    !runtime.identity?.endsWith(`@${policy.project}.iam.gserviceaccount.com`)
  ) {
    fail(`Google runtime policy lacks a scoped identity for ${component}`);
  }
}
for (const retired of ['lib/northflank/runtime.ts', 'lib/northflank/elevate-media-sync.ts']) {
  if (existsSync(join(root, retired)))
    fail(`Retired provider client must not be restored: ${retired}`);
}

const uiPaths = [
  'components/admin/dashboard/LizzyContainer.tsx',
  'components/admin/dashboard/LizzyWorkspace.tsx',
  'components/studio/DevContainerPanel.tsx',
  'components/studio/SecretsPanel.tsx',
];
const banned = [/sk_live_[a-zA-Z0-9]+/, /sk_test_[a-zA-Z0-9]+/, /eyJhbGci[a-zA-Z0-9._-]{30,}/];
for (const rel of uiPaths) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  for (const re of banned) {
    if (re.test(src)) fail(`${rel} contains a hardcoded credential pattern`);
  }
}

if (failed === 0) {
  console.info('\nAll devcontainer env wiring checks passed.');
  process.exit(0);
} else {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
