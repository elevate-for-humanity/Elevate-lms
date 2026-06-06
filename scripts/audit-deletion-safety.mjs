#!/usr/bin/env node
/**
 * Gate for dead-code deletion. Exits 1 if the target path is still referenced
 * or serves a live route. Run BEFORE deleting any file.
 *
 * Usage:
 *   node scripts/audit-deletion-safety.mjs components/programs/VisualProgramTemplate.tsx
 *   node scripts/audit-deletion-safety.mjs app/programs/old-slug/page.tsx
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
const basename = rel.endsWith('/page.tsx')
  ? path.basename(path.dirname(rel))
  : path.basename(rel, path.extname(rel));
const issues = [];

// 1. Inbound imports (ripgrep)
try {
  const rg = execSync(
    `rg -l --glob '!${rel}' --glob '!node_modules' --glob '!.next' "${basename}" app components lib apps 2>/dev/null || true`,
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  ).trim();
  if (rg) {
    const files = rg.split('\n').filter(Boolean);
    if (files.length > 0) {
      issues.push({ type: 'IMPORT_REF', detail: files.slice(0, 15) });
    }
  }
} catch {
  /* rg missing refs is ok */
}

// 2. Route map — is this a page.tsx?
if (rel.endsWith('/page.tsx')) {
  const routeMapPath = path.join(ROOT, 'reports/canonicalization/route-map.json');
  if (fs.existsSync(routeMapPath)) {
    const routes = JSON.parse(fs.readFileSync(routeMapPath, 'utf8'));
    const match = routes.find?.((r) => r.file === rel) ?? null;
    if (match) {
      issues.push({ type: 'LIVE_ROUTE', detail: match.route });
    }
  }
  const appSegment = rel.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/';
  issues.push({
    type: 'ROUTE_PATH',
    detail: `Manual check: ${appSegment} may be linked in nav/redirects`,
  });
}

// 3. Redirect sources pointing at derived route
if (rel.startsWith('app/') && rel.endsWith('/page.tsx')) {
  const route = '/' + rel
    .replace(/^app\//, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/\([^)]+\)/g, '');
  const canonicalPath = path.join(ROOT, 'lib/routes/canonical-routes.json');
  if (fs.existsSync(canonicalPath)) {
    const cfg = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
    const hits = (cfg.legacyAliases || []).filter(
      (a) => a.destination === route || a.source === route,
    );
    if (hits.length > 0) {
      issues.push({ type: 'REDIRECT_REF', detail: hits });
    }
  }
}

console.log(`\n[deletion-safety] ${rel}\n`);

if (issues.length === 0) {
  console.log('✅ No blocking references found (still verify orphan report manually).\n');
  process.exit(0);
}

for (const issue of issues) {
  console.log(`⚠️  ${issue.type}:`);
  if (Array.isArray(issue.detail)) {
    for (const d of issue.detail) console.log(`   ${typeof d === 'string' ? d : JSON.stringify(d)}`);
  } else {
    console.log(`   ${issue.detail}`);
  }
}

console.log('\n❌ Deletion blocked — resolve references or run route audit first.\n');
process.exit(1);
