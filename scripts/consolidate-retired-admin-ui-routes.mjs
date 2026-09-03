#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADMIN_ORIGIN = 'https://admin.elevateforhumanity.org';
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const scopes = [
  { root: 'apps/admin/app', mode: 'root' },
  { root: 'apps/lms/app', mode: 'absolute' },
  { root: 'apps/marketing/app', mode: 'absolute' },
  { root: 'components', mode: 'absolute' },
  { root: 'lib/routes', mode: 'root' },
  { root: 'lib/auth', mode: 'root' },
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

function canonicalPath(oldPath) {
  if (oldPath === '/admin' || oldPath === '/admin/') return '/dashboard';

  const mappings = [
    ['/admin/studio/courses/create', '/course-builder'],
    ['/admin/studio/courses/generate', '/course-builder'],
    ['/admin/studio/courses', '/course-builder'],
    ['/admin/studio/courseId', '/course-builder'],
    ['/admin/course-builder', '/course-builder'],
    ['/admin/quiz-builder', '/course-builder'],
    ['/admin/studio/workflows', '/studio/workflows'],
    ['/admin/studio', '/studio'],
    ['/admin/dashboard', '/dashboard'],
  ];

  for (const [source, destination] of mappings) {
    if (oldPath === source) return destination;
    if (oldPath.startsWith(`${source}?`) || oldPath.startsWith(`${source}#`)) {
      return destination + oldPath.slice(source.length);
    }
  }

  return oldPath.replace(/^\/admin(?=\/)/, '');
}

function rewriteLiteral(raw, mode) {
  if (!raw.startsWith('/admin')) return raw;
  if (raw.startsWith('/api/admin')) return raw;
  const canonical = canonicalPath(raw);
  return mode === 'absolute' ? `${ADMIN_ORIGIN}${canonical}` : canonical;
}

function rewriteContent(content, mode) {
  let next = content;

  // Quoted and template-literal strings beginning with /admin. API namespace is excluded.
  next = next.replace(/(["'`])(\/admin(?:\/[A-Za-z0-9_\-.[\]${}?=&%/:]+)?)(?=\1)/g, (full, quote, route) => {
    if (route.startsWith('/api/admin')) return full;
    return `${quote}${rewriteLiteral(route, mode)}`;
  });

  // Template literals may contain interpolations and therefore are not always matched by the
  // closing-quote expression above. Rewrite their opening route prefix safely.
  next = next.replace(/`\/admin(?=\/)/g, () => mode === 'absolute' ? `\`${ADMIN_ORIGIN}` : '`');

  // Quoted strings with query/hash fragments and interpolated tails.
  next = next.replace(/(["'])(\/admin(?=\/)[^"'\n]*)\1/g, (full, quote, route) => {
    if (route.startsWith('/api/admin')) return full;
    return `${quote}${rewriteLiteral(route, mode)}${quote}`;
  });

  // Exact quoted /admin.
  next = next.replace(/(["'`])\/admin\1/g, (_full, quote) => {
    const target = mode === 'absolute' ? `${ADMIN_ORIGIN}/dashboard` : '/dashboard';
    return `${quote}${target}${quote}`;
  });

  // Normalize any accidental absolute legacy Admin URLs.
  next = next.replaceAll(`${ADMIN_ORIGIN}/admin/`, `${ADMIN_ORIGIN}/`);
  next = next.replaceAll(`${ADMIN_ORIGIN}/admin`, `${ADMIN_ORIGIN}/dashboard`);

  return next;
}

let changedFiles = 0;
let replacements = 0;

for (const scope of scopes) {
  for (const file of collect(scope.root)) {
    const absolute = path.join(ROOT, file);
    const before = fs.readFileSync(absolute, 'utf8');
    const after = rewriteContent(before, scope.mode);
    if (after !== before) {
      fs.writeFileSync(absolute, after);
      changedFiles += 1;
      const beforeCount = (before.match(/\/admin(?:\/|["'`])/g) ?? []).length;
      const afterCount = (after.match(/\/admin(?:\/|["'`])/g) ?? []).length;
      replacements += Math.max(0, beforeCount - afterCount);
      console.log(`updated ${file}`);
    }
  }
}

console.log(`Consolidation complete: ${changedFiles} files changed, approximately ${replacements} retired UI references removed.`);
