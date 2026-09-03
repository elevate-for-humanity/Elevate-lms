#!/usr/bin/env node
/**
 * quarantine-audit.mjs
 *
 * Validates the current quarantine state. Exits non-zero if violations found.
 * Run before every quarantine operation and in CI.
 *
 *   pnpm quarantine:audit
 *
 * Flags:
 *   --fix        Auto-restore quarantined routes that have live refs
 *   --json       Output results as JSON
 *   --verbose    Show all routes, not just violations
 */

import { readFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, 'quarantine-routes.json');
const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const JSON_OUT = args.includes('--json');
const VERBOSE = args.includes('--verbose');

// ── High-risk prefixes (must never be quarantined) ──────────────────────────
const HIGH_RISK_PREFIXES = [
  '/apply',
  '/accept-invite',
  '/login',
  '/signup',
  '/reset-password',
  '/forgot-password',
  '/auth',
  '/api/auth',
  '/api/applications',
  '/api/enrollment',
  '/api/enroll',
  '/api/program-holder',
  '/program-holder',
  '/admin/dashboard',
  '/payment',
  '/checkout',
  '/api/stripe',
  '/api/checkout',
  '/api/payments',
  '/api/webhooks',
];

// ── Ref-detection patterns ──────────────────────────────────────────────────
const REF_PATTERNS = [
  /href\s*=\s*[`'"](\/[^`'">\s]+)/g,
  /router\.(push|replace)\s*\(\s*[`'"](\/[^`'"]+)/g,
  /redirect\s*\(\s*[`'"](\/[^`'"]+)/g,
  /permanentRedirect\s*\(\s*[`'"](\/[^`'"]+)/g,
  /fetch\s*\(\s*[`'"](\/[^`'"]+)/g,
  /axios\.[a-z]+\s*\(\s*[`'"](\/[^`'"]+)/g,
  /fetch\s*\(\s*`(\/[^`$]+)/g,
  /axios\.[a-z]+\s*\(\s*`(\/[^`$]+)/g,
  /router\.(push|replace)\s*\(\s*`(\/[^`$]+)/g,
];

// ── ES module import ref detection ──────────────────────────────────────────
// Detects: import X from '@/app/foo/Bar' or import X from './Bar'
const IMPORT_RE = /from\s+['"](@\/app\/[^'"]+|\.\.?\/[^'"]+)['"]/g;
const EXPORT_RE = /export\s+\{[^}]+\}\s+from\s+['"](@\/app\/[^'"]+|\.\.?\/[^'"]+)['"]/g;

function resolveImport(imp, sourceFile) {
  if (imp.startsWith('@/app/')) return imp.replace('@/', '');
  if (imp.startsWith('.')) return relative(ROOT, join(dirname(sourceFile), imp));
  return null;
}

function extractRefs(content) {
  const refs = new Set();
  for (const pattern of REF_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(content)) !== null) {
      const path = m[m.length - 1];
      if (path && path.startsWith('/')) {
        refs.add(path.split('?')[0].split('#')[0]);
      }
    }
  }
  return refs;
}

function isQuarantined(filePath) {
  return filePath.split('/').some((seg) => seg.startsWith('__'));
}

function quarantinedToLive(filePath) {
  return filePath.replace(/\/__([^/]+)/g, '/$1');
}

function appPathToRoute(filePath) {
  return (
    filePath
      .replace(/^app/, '')
      .replace(/\/page\.tsx$/, '')
      .replace(/\/route\.ts$/, '')
      .replace(/\/\(app\)/, '')
      .replace(/\/\(auth\)/, '')
      .replace(/\/\(dashboard\)/, '')
      .replace(/\/\(partner\)/, '')
      .replace(/\/\(public\)/, '')
      .replace(/\/layout\.tsx$/, '') || '/'
  );
}

function isHighRisk(route) {
  return HIGH_RISK_PREFIXES.some((p) => route === p || route.startsWith(p + '/'));
}

function restoreFile(quarantinedFile) {
  const liveFile = quarantinedToLive(quarantinedFile);
  const liveDir = dirname(liveFile);
  mkdirSync(join(ROOT, liveDir), { recursive: true });
  renameSync(join(ROOT, quarantinedFile), join(ROOT, liveFile));
  return liveFile;
}

// ── Scan live source files for all refs ─────────────────────────────────────
if (!JSON_OUT) console.log('Scanning source files...');

const sourceFiles = globSync('**/*.{tsx,ts}', {
  cwd: ROOT,
  // Exclude: node_modules, build output, scripts, AND all quarantined dirs
  // (_archived, __* prefixed dirs) — refs from dead code don't count
  ignore: [
    'node_modules/**',
    '.next/**',
    'scripts/**',
    '_archived/**',
    'app/**/__*/**',
    'app/__*/**',
  ],
  absolute: true,
});

const allRefs = new Map(); // route-prefix → Set<sourceFile>
// importedQuarantinedFiles: quarantined-file-path → Set<sourceFile>
// Built by scanning ALL live files for imports that resolve into quarantined dirs.
const importedQuarantinedFiles = new Map();

// Build a map of all quarantined files (key = path without extension)
const allQuarantinedFiles = globSync('app/**/*.{tsx,ts}', {
  cwd: ROOT,
  ignore: ['node_modules/**', '.next/**'],
}).filter(isQuarantined);

const quarantinedFileMap = new Map(); // key → quarantined path
for (const f of allQuarantinedFiles) {
  quarantinedFileMap.set(f.replace(/\.(tsx?|jsx?)$/, ''), f);
}

for (const file of sourceFiles) {
  const rel = relative(ROOT, file);
  if (isQuarantined(rel)) continue;
  const content = readFileSync(file, 'utf8');

  // Route refs (href, fetch, router.push, etc.)
  const refs = extractRefs(content);
  for (const ref of refs) {
    if (!allRefs.has(ref)) allRefs.set(ref, new Set());
    allRefs.get(ref).add(rel);
  }

  // ES module import refs — resolve each import to a file path and check
  // if it lands inside a quarantined directory
  for (const re of [IMPORT_RE, EXPORT_RE]) {
    const r = new RegExp(re.source, re.flags);
    let m;
    while ((m = r.exec(content)) !== null) {
      const resolved = resolveImport(m[1], file);
      if (!resolved) continue;
      const key = resolved.replace(/\.(tsx?|jsx?)$/, '');
      if (quarantinedFileMap.has(key)) {
        const qf = quarantinedFileMap.get(key);
        if (!importedQuarantinedFiles.has(qf)) importedQuarantinedFiles.set(qf, new Set());
        importedQuarantinedFiles.get(qf).add(rel);
      }
    }
  }
}

// ── Collect quarantined files (routes AND co-located components) ─────────────
const quarantinedFiles = globSync('app/**/*.{tsx,ts}', {
  cwd: ROOT,
  ignore: ['node_modules/**', '.next/**'],
}).filter(isQuarantined);

// ── Run checks ──────────────────────────────────────────────────────────────
const violations = [];
const fixed = [];

for (const file of quarantinedFiles) {
  const liveFile = quarantinedToLive(file);
  const route = appPathToRoute(liveFile);
  const isPageOrRoute = file.endsWith('page.tsx') || file.endsWith('route.ts');
  const type = file.endsWith('page.tsx') ? 'page' : 'route';

  // Check 1: high-risk route is quarantined (only applies to page/route files)
  if (isPageOrRoute && isHighRisk(route)) {
    violations.push({
      severity: 'error',
      rule: 'high-risk-quarantined',
      route,
      file,
      message: `High-risk route is quarantined and unreachable`,
    });
    if (FIX) {
      const restored = restoreFile(file);
      fixed.push({ route, restored });
    }
    continue;
  }

  // Check 2: quarantined route has live inbound route refs (href, fetch, etc.)
  // Only applies to page.tsx and route.ts files
  let refCount = 0;
  const refFiles = [];
  if (isPageOrRoute) {
    for (const [ref, files] of allRefs) {
      const routeBase = route.replace(/\/\[[^\]]+\]/g, '');
      if (
        ref === route ||
        ref.startsWith(route + '/') ||
        (routeBase && ref.startsWith(routeBase))
      ) {
        refCount += files.size;
        refFiles.push(...files);
      }
    }

    if (refCount > 0) {
      const isApi = route.startsWith('/api/');
      violations.push({
        severity: 'error',
        rule: isApi ? 'api-dynamically-referenced' : 'quarantined-has-live-ref',
        route,
        file,
        refCount,
        refFiles: [...new Set(refFiles)].slice(0, 5),
        message: `Quarantined route has ${refCount} live inbound ref(s)`,
      });
      if (FIX) {
        const restored = restoreFile(file);
        fixed.push({ route, restored });
      }
    }
  }

  // Check 3: quarantined FILE is directly imported by a live file (ES module import).
  // Uses the pre-built importedQuarantinedFiles map which resolves every import
  // path to its actual file on disk — catches co-located components swept into
  // quarantine alongside their parent directory.
  const importers = importedQuarantinedFiles.get(file);
  if (importers && importers.size > 0 && refCount === 0) {
    violations.push({
      severity: 'error',
      rule: 'quarantined-file-imported',
      route,
      file,
      refCount: importers.size,
      refFiles: [...importers].slice(0, 5),
      message: `Quarantined file is imported by ${importers.size} live file(s)`,
    });
    if (FIX) {
      const restored = restoreFile(file);
      fixed.push({ route, restored });
    }
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  console.log(JSON.stringify({ violations, fixed, passed: violations.length === 0 }, null, 2));
} else {
  if (fixed.length > 0) {
    console.log(`\n✅ Auto-restored ${fixed.length} route(s):`);
    for (const { route, restored } of fixed) {
      console.log(`   ${route} → ${restored}`);
    }
  }

  if (violations.length === 0) {
    console.log(`\n✅ quarantine:audit passed — no violations found`);
    console.log(`   Quarantined routes: ${quarantinedFiles.length}`);
  } else {
    const unfixed = FIX
      ? violations.filter((v) => !fixed.find((f) => f.route === v.route))
      : violations;
    if (unfixed.length > 0) {
      console.error(`\n❌ quarantine:audit FAILED — ${unfixed.length} violation(s):\n`);
      for (const v of unfixed) {
        console.error(`  [${v.severity.toUpperCase()}] ${v.rule}`);
        console.error(`    Route:   ${v.route}`);
        console.error(`    File:    ${v.file}`);
        if (v.refCount) console.error(`    Refs:    ${v.refCount}`);
        if (v.refFiles?.length) {
          for (const f of v.refFiles) console.error(`             ← ${f}`);
        }
        console.error(`    Fix:     pnpm quarantine:restore "${v.route}"`);
        console.error('');
      }
      process.exit(1);
    } else {
      console.log(`\n✅ quarantine:audit passed after auto-fixing ${fixed.length} route(s)`);
    }
  }
}

// ── 404 monitor recommendation ───────────────────────────────────────────────
if (!JSON_OUT && violations.length === 0) {
  // Collect quarantined route prefixes for monitoring
  const quarantinedRoutes = quarantinedFiles.map((f) => appPathToRoute(quarantinedToLive(f)));
  const uniquePrefixes = [
    ...new Set(quarantinedRoutes.map((r) => r.split('/').slice(0, 3).join('/'))),
  ].sort();

  console.log(`\n📊 Production 404 monitor — watch these prefixes for unexpected traffic:`);
  for (const prefix of uniquePrefixes.slice(0, 20)) {
    console.log(`   ${prefix}`);
  }
  if (uniquePrefixes.length > 20) {
    console.log(`   ... and ${uniquePrefixes.length - 20} more (see quarantine-routes.json)`);
  }
  console.log(`\n   Add to your logging middleware:`);
  console.log(`   if (response.status === 404) {`);
  console.log(`     const quarantinedPrefixes = ${JSON.stringify(uniquePrefixes.slice(0, 5))};`);
  console.log(`     if (quarantinedPrefixes.some(p => request.nextUrl.pathname.startsWith(p))) {`);
  console.log(`       logger.warn('[quarantine-404]', { path: request.nextUrl.pathname });`);
  console.log(`     }`);
  console.log(`   }`);
}
