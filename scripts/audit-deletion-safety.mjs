#!/usr/bin/env node
/**
 * Gate for dead-code / route deletion across the Elevate monorepo.
 *
 * This script is intentionally conservative: a route deletion is BLOCKED when
 * the target still has inbound references, still represents a routable page,
 * or appears in canonical/legacy route registries. The operator must first
 * preserve unique behavior in the selected canonical implementation and update
 * every caller.
 *
 * Usage:
 *   node scripts/audit-deletion-safety.mjs apps/admin/app/admin/students/page.tsx
 *   node scripts/audit-deletion-safety.mjs apps/marketing/app/shop/page.tsx
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/audit-deletion-safety.mjs <workspace-relative-path>');
  process.exit(2);
}

const abs = path.resolve(ROOT, target);
if (!fs.existsSync(abs)) {
  console.error(`❌ File not found: ${target}`);
  process.exit(2);
}

const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
const issues = [];

const APP_ROOTS = [
  'apps/marketing/app/',
  'apps/lms/app/',
  'apps/admin/app/',
  'apps/portal/app/',
  // Keep legacy root app support until the consolidation audit proves it empty.
  'app/',
];

function deriveRoute(file) {
  if (!file.endsWith('/page.tsx') && !file.endsWith('/page.jsx') && !file.endsWith('/page.js')) {
    return null;
  }

  const root = APP_ROOTS.find((candidate) => file.startsWith(candidate));
  if (!root) return null;

  let route = file.slice(root.length).replace(/\/page\.(tsx|jsx|js)$/, '');
  // Next.js route groups do not appear in the URL.
  route = route.replace(/(^|\/)\([^)]+\)(?=\/|$)/g, '');
  route = route.replace(/\/+/, '/');
  return route ? `/${route}`.replace(/\/{2,}/g, '/') : '/';
}

function safeRg(pattern) {
  try {
    return execSync(
      `rg -l --fixed-strings --glob '!${rel}' --glob '!node_modules/**' --glob '!.next/**' --glob '!reports/**' ${JSON.stringify(pattern)} app apps components lib packages scripts 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    ).trim();
  } catch {
    return '';
  }
}

// 1. Inbound symbol/import references.
const basename = rel.endsWith('/page.tsx')
  ? path.basename(path.dirname(rel))
  : path.basename(rel, path.extname(rel));
const symbolRefs = safeRg(basename);
if (symbolRefs) {
  issues.push({ type: 'SYMBOL_OR_IMPORT_REF', detail: symbolRefs.split('\n').filter(Boolean).slice(0, 25) });
}

// 2. Route references across all apps/navigation/config/tests.
const route = deriveRoute(rel);
if (route) {
  const routeRefs = safeRg(route);
  if (routeRefs) {
    issues.push({ type: 'ROUTE_REF', detail: routeRefs.split('\n').filter(Boolean).slice(0, 40) });
  }

  // A page is a live route by definition. Deleting it requires an explicit
  // consolidation decision rather than a green "unused" signal.
  issues.push({
    type: 'LIVE_ROUTE',
    detail: `${route} (${rel}) — prove feature parity and update all callers before deletion`,
  });
}

// 3. Canonical/legacy route registries.
const registryFiles = [
  'lib/navigation/routes.ts',
  'lib/routes/canonical-routes.json',
  'config/canonical-routes.json',
  'reports/canonicalization/route-map.json',
];
for (const registry of registryFiles) {
  const registryPath = path.join(ROOT, registry);
  if (!fs.existsSync(registryPath)) continue;
  const text = fs.readFileSync(registryPath, 'utf8');
  if ((route && text.includes(route)) || text.includes(rel)) {
    issues.push({ type: 'ROUTE_REGISTRY_REF', detail: registry });
  }
}

console.log(`\n[deletion-safety] ${rel}`);
if (route) console.log(`[route] ${route}`);
console.log('');

if (issues.length === 0) {
  console.log('✅ No blocking references found. Non-route deletion may proceed after normal tests.\n');
  process.exit(0);
}

for (const issue of issues) {
  console.log(`⚠️  ${issue.type}:`);
  if (Array.isArray(issue.detail)) {
    for (const d of issue.detail) console.log(`   ${d}`);
  } else {
    console.log(`   ${issue.detail}`);
  }
}

console.log('\n❌ Deletion blocked. Consolidate unique behavior, update callers, then re-audit.\n');
process.exit(1);
