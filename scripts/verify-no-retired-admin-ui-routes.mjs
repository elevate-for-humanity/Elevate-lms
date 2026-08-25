#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const violations = [];

function read(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) {
    violations.push(`${relativePath} is missing`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

// The Admin app must never recreate a nested /admin route tree. The Admin
// hostname owns root routes such as /dashboard, /studio, and /applications.
const retiredTree = path.join(ROOT, 'apps/admin/app/admin');
if (fs.existsSync(retiredTree)) {
  violations.push('apps/admin/app/admin exists; retired parallel Admin UI tree must not exist');
}

// Retired private /admin aliases must not be preserved as compatibility
// redirects on any deployed service. Callers must use the canonical Admin host
// and root route directly.
for (const configPath of [
  'apps/admin/next.config.mjs',
  'apps/lms/next.config.mjs',
  'apps/marketing/next.config.mjs',
]) {
  const config = read(configPath);
  for (const forbidden of ["source: '/admin'", "source: '/admin/", "source: '/dev-studio/:path*'"]) {
    if (config.includes(forbidden)) {
      violations.push(`${configPath} contains retired private alias ${forbidden}`);
    }
  }
}

// Central route constants are not allowed to reintroduce the old namespace.
const canonicalRoutes = read('lib/routes/canonical-routes.ts');
for (const forbidden of [
  "'/admin/dashboard'",
  "'/admin/studio'",
  "'/admin/course-builder'",
  "'/admin/applications'",
  "'/admin/students'",
]) {
  if (canonicalRoutes.includes(forbidden)) {
    violations.push(`lib/routes/canonical-routes.ts contains retired UI route ${forbidden}`);
  }
}

if (violations.length) {
  console.error('Retired Admin UI namespace protection failed:');
  for (const violation of violations) console.error(` - ${violation}`);
  process.exit(1);
}

console.log('Admin UI namespace guard passed: retired /admin routes and compatibility aliases are absent.');
