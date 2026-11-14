/**
 * scripts/audit-program-application-routes.mjs
 *
 * Audits lib/programs/application-config.ts to verify that every
 * formPath in the config actually points to an existing file.
 *
 * Run: node scripts/audit-program-application-routes.mjs
 * Exit 1 on failure, 0 on success.
 */
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();

const configPath = resolve(root, 'lib/programs/application-config.ts');

let source;
try {
  source = await Bun.file(configPath).text();
} catch {
  // Fallback for Node.js
  const { readFileSync } = await import('node:fs');
  source = readFileSync(configPath, 'utf8');
}

// Extract all formPath values for 'dedicated' programs
const formPathMatches = [...source.matchAll(/formPath:\s*['"`]([^'"`]+)['"`]/g)];

const failures = [];

for (const match of formPathMatches) {
  const route = match[1];

  // Skip external URLs and canonical (no formPath)
  if (!route.startsWith('/programs/')) continue;

  const routePath = route.replace(/^\//, '').replace(/\/$/, '');
  const parts = routePath.split('/');

  // /programs/barber-apprenticeship/apply → /programs/barber-apprenticeship/apply/page.tsx
  const pagePath = resolve(root, 'apps/marketing/app', routePath, 'page.tsx');

  let exists = false;
  try {
    await access(pagePath);
    exists = true;
  } catch {
    exists = false;
  }

  if (!exists) {
    failures.push({
      route,
      expectedFile: pagePath.replace(`${root}/`, ''),
    });
  }
}

if (failures.length > 0) {
  console.error('\nApplication route audit FAILED:\n');
  for (const failure of failures) {
    console.error(`  ✗ ${failure.route}`);
    console.error(`    Missing: ${failure.expectedFile}`);
  }
  console.error(`\nTotal: ${failures.length} invalid formPath(s)\n`);
  process.exit(1);
}

console.log(
  `✓ Application route audit passed: ${formPathMatches.length} dedicated formPath(s) verified.`,
);
