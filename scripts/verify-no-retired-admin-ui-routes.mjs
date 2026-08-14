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

const adminConfig = read('apps/admin/next.config.mjs');
if (!adminConfig.includes("source: '/admin'")) {
  violations.push('Admin edge is missing the /admin compatibility redirect');
}
if (!adminConfig.includes("source: '/admin/:path*'")) {
  violations.push('Admin edge is missing the /admin/:path* compatibility redirect');
}
if (!adminConfig.includes("destination: '/:path*'")) {
  violations.push('Admin edge must strip the retired /admin prefix');
}

for (const configPath of ['apps/lms/next.config.mjs', 'apps/marketing/next.config.mjs']) {
  const config = read(configPath);
  if (!config.includes("source: '/admin'")) {
    violations.push(`${configPath} is missing the /admin cross-service redirect`);
  }
  if (!config.includes("source: '/admin/:path*'")) {
    violations.push(`${configPath} is missing the /admin/:path* cross-service redirect`);
  }
  if (!config.includes("https://admin.elevateforhumanity.org/:path*")) {
    violations.push(`${configPath} must send retired Admin paths to the canonical Admin hostname`);
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

console.log('Admin UI namespace guard passed: retired /admin paths cannot resolve as canonical UI routes.');
