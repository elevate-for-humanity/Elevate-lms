#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outArg = outIndex >= 0 ? args[outIndex + 1] : null;
const OUT = outArg
  ? path.resolve(process.cwd(), outArg)
  : path.join(ROOT, 'artifacts', 'platform-doctor-static-report.json');

const findings = [];
const checks = [];

function rel(abs) {
  return path.relative(ROOT, abs).replaceAll('\\', '/');
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function addFinding(code, file, line, message) {
  findings.push({ severity: 'CRITICAL', code, file, line, message });
}

function addCheck(name, count, summaryWhenClean) {
  checks.push({
    name,
    status: count ? 'fail' : 'pass',
    summary: count ? `${count} finding(s)` : summaryWhenClean,
  });
}

function walk(dir, exts = new Set(['.ts', '.tsx', '.js', '.jsx'])) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage', 'test-results'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function checkAdminGuards() {
  const adminApiDir = path.join(ROOT, 'app', 'api', 'admin');
  if (!fs.existsSync(adminApiDir)) {
    addCheck('adminGuards', 0, 'no app/api/admin directory');
    return;
  }
  let count = 0;
  for (const file of walk(adminApiDir)) {
    if (!/route\.(t|j)sx?$/.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const hasCanonicalGuard =
      content.includes('apiRequireAdmin') ||
      content.includes('apiAuthGuard') ||
      content.includes('apiRequireInstructor');
    const hasLegacyGuard =
      content.includes('withAuth') ||
      content.includes('getCurrentUser') ||
      content.includes('auth.getUser') ||
      content.includes('requireAdmin') ||
      content.includes('requireInstructor') ||
      content.includes('withApiAudit') ||
      content.includes('guard(') ||
      /\bguard\b.*=.*await/.test(content);
    const publicRoute = content.includes('// PUBLIC ROUTE:');
    if (!hasCanonicalGuard && !hasLegacyGuard && !publicRoute) {
      count += 1;
      addFinding('AUTH_GUARD_MISSING', rel(file), 1, 'Admin API route may be missing auth guard');
    }
  }
  addCheck('adminGuards', count, 'all routes guarded');
}

function checkUnsafeServerAnonWrites() {
  const dirs = [path.join(ROOT, 'app', 'api', 'admin'), path.join(ROOT, 'lib', 'admin')].filter((d) => fs.existsSync(d));
  const anonImport = [
    /from ['"]@\/lib\/supabase\/client['"]/,
    /createBrowserClient\(/,
    /createClientComponentClient\(/,
  ];
  const writeOps = /\.(insert|update|upsert|delete)\(/;
  let count = 0;
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("'use client'") || content.includes('"use client"')) continue;
      if (anonImport.some((re) => re.test(content)) && writeOps.test(content)) {
        count += 1;
        addFinding(
          'UNSAFE_ANON_SERVER_WRITE',
          rel(file),
          1,
          'Server/admin flow appears to use anon browser client for write operation',
        );
      }
    }
  }
  addCheck('unsafeServerAnonWrites', count, 'no unsafe anon writes detected');
}

function collectAppRoutes() {
  const appDirs = [
    path.join(ROOT, 'app'),
    path.join(ROOT, 'apps', 'marketing', 'app'),
    path.join(ROOT, 'apps', 'lms', 'app'),
    path.join(ROOT, 'apps', 'admin', 'app'),
  ];
  const routes = new Set(['/']);

  function traverse(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        traverse(full, `${prefix}${segment}`);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx' || entry.name === 'page.ts') {
        routes.add(prefix || '/');
      }
    }
  }

  for (const appDir of appDirs) {
    if (fs.existsSync(appDir)) traverse(appDir, '');
  }
  return routes;
}

function checkBrokenInternalRoutes() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  const routes = collectAppRoutes();
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const hrefRe = /href=["'](\/[^"'#?\s]*)["']/g;
    for (const match of content.matchAll(hrefRe)) {
      const target = match[1];
      if (target.startsWith('/api') || target.includes('[') || target === '/') continue;
      const lastSeg = target.split('/').pop() || '';
      if (lastSeg.includes('.')) continue;
      const exists =
        routes.has(target) ||
        routes.has(`${target}/`) ||
        [...routes].some((route) => {
          if (!route.includes('[')) return false;
          const prefix = route.split('[')[0];
          return target.startsWith(prefix) || target === prefix.replace(/\/$/, '');
        });
      if (!exists) {
        count += 1;
        addFinding(
          'BROKEN_INTERNAL_ROUTE',
          rel(file),
          lineNumber(content, match.index),
          `Internal href points to route not found: ${target}`,
        );
      }
    }
  }
  addCheck('brokenInternalRoutes', count, 'no obvious broken internal hrefs');
}

function checkFakeStats() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  const patterns = [
    /\b10,000\+?\s+students\b/gi,
    /\b\d{1,3},\d{3}\+\s+(students|graduates|learners)\b/gi,
    /join thousands/gi,
    /demo stats?/gi,
  ];
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const re of patterns) {
      for (const match of content.matchAll(re)) {
        count += 1;
        addFinding(
          'FAKE_CREDIBILITY_STAT',
          rel(file),
          lineNumber(content, match.index),
          `Potential fake/demo credibility stat: "${match[0]}"`,
        );
      }
    }
  }
  addCheck('fakeStats', count, 'no fake stats detected');
}

function checkSwallowedCatchBlocks() {
  const files = [
    ...walk(path.join(ROOT, 'app')),
    ...walk(path.join(ROOT, 'lib')),
    ...walk(path.join(ROOT, 'components')),
  ];
  const swallowRe = /catch\s*\(([^)]*)\)\s*\{\s*(?:\/\/[^\n]*)?\s*\}/g;
  let count = 0;
  for (const file of files) {
    const relative = rel(file);
    if (/\.test\.|\/tests\//.test(relative)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(swallowRe)) {
      count += 1;
      addFinding(
        'SWALLOWED_CATCH',
        relative,
        lineNumber(content, match.index),
        'Empty catch block in production code',
      );
    }
  }
  addCheck('swallowedCatch', count, 'no swallowed catch blocks detected');
}

checkAdminGuards();
checkUnsafeServerAnonWrites();
checkBrokenInternalRoutes();
checkFakeStats();
checkSwallowedCatchBlocks();

const report = {
  tool: 'platform-doctor-static-v1',
  timestamp: new Date().toISOString(),
  root: ROOT,
  countsBySeverity: { CRITICAL: findings.length, STRICT: 0, REPORT: 0 },
  checks,
  findings,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`Platform Doctor static scan: CRITICAL=${findings.length}`);
console.log(`Report: ${OUT}`);
