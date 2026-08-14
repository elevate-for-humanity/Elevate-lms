#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_ROOTS = [
  'apps/admin/app',
  'apps/lms/app',
  'apps/marketing/app',
  'components',
  'lib/routes',
  'lib/auth',
];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const retiredUiPatterns = [
  { name: 'href', regex: /href\s*=\s*["'`]\/admin(?:\/|["'`])/g },
  { name: 'redirect', regex: /(?:permanentRedirect|redirect)\(\s*["'`]\/admin(?:\/|["'`])/g },
  { name: 'router navigation', regex: /router\.(?:push|replace)\(\s*["'`]\/admin(?:\/|["'`])/g },
  { name: 'window navigation', regex: /window\.location(?:\.href)?\s*=\s*["'`]\/admin(?:\/|["'`])/g },
  { name: 'literal UI route', regex: /["'`]\/admin\/(?!api\/)[A-Za-z0-9_[\].?=&%${}\-/:]+["'`]/g },
];

function collect(relativeDir) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolute = path.join(absoluteDir, entry.name);
    const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) files.push(...collect(relative));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(relative);
  }
  return files;
}

const violations = [];
for (const sourceRoot of SOURCE_ROOTS) {
  for (const file of collect(sourceRoot)) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const { name, regex } of retiredUiPatterns) {
      regex.lastIndex = 0;
      for (const match of content.matchAll(regex)) {
        const before = content.slice(0, match.index);
        const line = before.split('\n').length;
        const text = match[0];
        if (text.includes('/api/admin/')) continue;
        violations.push(`${file}:${line} [${name}] ${text}`);
      }
    }
  }
}

const retiredTree = path.join(ROOT, 'apps/admin/app/admin');
if (fs.existsSync(retiredTree)) {
  violations.push('apps/admin/app/admin [route tree] retired parallel Admin UI tree exists');
}

if (violations.length) {
  console.error('Retired /admin UI namespace is still exposed from executable source:');
  for (const violation of [...new Set(violations)].sort()) console.error(` - ${violation}`);
  console.error('\nUse canonical Admin-domain root routes such as /dashboard, /studio, /course-builder, /applications, /students, etc.');
  process.exit(1);
}

console.log('Admin UI route guard passed: no retired /admin UI routes are exposed.');
