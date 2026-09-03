#!/usr/bin/env node
/**
 * Verifies dev container / Northflank env wiring — no fake credentials in UI paths.
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

const envExample = readFileSync(join(root, '.env.example'), 'utf8');
const requiredNorthflankKeys = [
  'NORTHFLANK_API_TOKEN',
  'NORTHFLANK_PROJECT_ID',
  'NORTHFLANK_LMS_SERVICE_ID',
  'NORTHFLANK_ADMIN_SERVICE_ID',
  'NORTHFLANK_SECRET_GROUP_ID',
];

const missingNorthflankKeys = requiredNorthflankKeys.filter((key) => !envExample.includes(key));
if (missingNorthflankKeys.length > 0) {
  fail(`.env.example is missing Northflank keys: ${missingNorthflankKeys.join(', ')}`);
} else {
  ok('Northflank runtime env keys are documented in .env.example');
}

const devPanel = readFileSync(join(root, 'components/dev-studio/DevContainerPanel.tsx'), 'utf8');
if (devPanel.includes("'https://staging.${PLATFORM_DEFAULTS")) {
  fail('DevContainerPanel staging preset still has broken literal ${...} URLs');
} else {
  ok('DevContainerPanel staging preset uses real template literals');
}

const northflankRuntime = readFileSync(join(root, 'lib/northflank/runtime.ts'), 'utf8');
if (!northflankRuntime.includes('NORTHFLANK_API_TOKEN') || !northflankRuntime.includes('triggerNorthflankBuild')) {
  fail('Northflank runtime helper is missing API token/build trigger wiring');
} else {
  ok('Northflank runtime helper is wired for deploy control');
}

const uiPaths = [
  'components/admin/dashboard/LizzyContainer.tsx',
  'components/admin/dashboard/LizzyWorkspace.tsx',
  'components/dev-studio/DevContainerPanel.tsx',
  'components/dev-studio/SecretsPanel.tsx',
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
