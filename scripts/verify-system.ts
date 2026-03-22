#!/usr/bin/env tsx
/**
 * verify-system.ts
 *
 * Runs a suite of fast, local invariant checks before deploy or CI.
 * Each check prints PASS / FAIL and exits 1 if any check fails.
 *
 * Usage:
 *   pnpm verify:system
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`  ✅  ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ❌  ${label}${detail ? `\n       ${detail}` : ''}`);
  failed++;
}

function section(title: string) {
  console.log(`\n── ${title}`);
}

// ─── 1. Required env vars ────────────────────────────────────────────────────

section('Environment variables');

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const envFile = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';

for (const key of REQUIRED_ENV) {
  if (process.env[key] || envContent.includes(`${key}=`)) {
    pass(key);
  } else {
    fail(key, 'not set in process.env or .env.local');
  }
}

// ─── 2. No hardcoded Supabase JWTs ───────────────────────────────────────────

section('No hardcoded secrets');

// Supabase service-role JWTs start with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
// and are long (>100 chars). We scan source files only.
const JWT_PATTERN = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}/;

const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts'];
const SKIP_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.mp4', '.mp3', '.pdf', '.ico', '.svg']);

function scanDir(dir: string): string[] {
  const hits: string[] = [];
  if (!fs.existsSync(dir)) return hits;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist'].includes(entry.name)) continue;
      hits.push(...scanDir(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTENSIONS.has(ext)) continue;
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (JWT_PATTERN.test(content)) {
          hits.push(path.relative(ROOT, full));
        }
      } catch {
        // binary or unreadable — skip
      }
    }
  }
  return hits;
}

const jwtHits = SOURCE_DIRS.flatMap((d) => scanDir(path.join(ROOT, d)));
if (jwtHits.length === 0) {
  pass('No hardcoded JWTs found in source');
} else {
  fail(`Hardcoded JWT found in ${jwtHits.length} file(s)`, jwtHits.slice(0, 5).join(', '));
}

// ─── 3. Build output exists ───────────────────────────────────────────────────

section('Build output');

const nextDir = path.join(ROOT, '.next');
if (fs.existsSync(nextDir) && fs.existsSync(path.join(nextDir, 'BUILD_ID'))) {
  pass('.next/BUILD_ID present');
} else {
  // Not a hard failure — build output is absent in fresh dev environments.
  // Run `pnpm build` before deploying.
  console.warn('  ⚠️   .next build output missing (run `pnpm build` before deploy)');
}

// ─── 4. Critical source files present ────────────────────────────────────────

section('Critical source files');

const CRITICAL_FILES = [
  'hooks/useVideoProgress.ts',
  'components/course/AutomaticCourseBuilder.tsx',
  'components/marketing/HeroVideo.tsx',
  'content/heroBanners.ts',
  'lib/supabase/server.ts',
  'lib/supabase/client.ts',
  'lib/api/safe-error.ts',
  'lib/api/withRateLimit.ts',
];

for (const f of CRITICAL_FILES) {
  if (fs.existsSync(path.join(ROOT, f))) {
    pass(f);
  } else {
    fail(f, 'file missing');
  }
}

// ─── 5. No href="#" in page components ───────────────────────────────────────

section('No dead hrefs');

try {
  // Scan only rendered UI dirs — exclude scripts/, lib/templates/ (not rendered)
  const UI_DIRS = ['app', 'components'].map((d) => path.join(ROOT, d));
  const result = execSync(
    `grep -r 'href="#"' ${UI_DIRS.join(' ')} --include="*.tsx" -l 2>/dev/null || true`,
    { encoding: 'utf8' }
  ).trim();
  const files = result ? result.split('\n').filter(Boolean) : [];
  if (files.length === 0) {
    pass('No href="#" in rendered UI');
  } else {
    fail(`href="#" found in ${files.length} UI file(s)`, files.slice(0, 3).map((f) => path.relative(ROOT, f)).join(', '));
  }
} catch {
  fail('href="#" scan failed');
}

// ─── 6. Playwright test for course builder exists ────────────────────────────

section('Test coverage');

const playwrightTest = path.join(ROOT, 'tests/e2e/course-builder.spec.ts');
if (fs.existsSync(playwrightTest)) {
  pass('tests/e2e/course-builder.spec.ts present');
} else {
  fail('tests/e2e/course-builder.spec.ts missing');
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`  ${passed} passed  |  ${failed} failed`);
console.log('─'.repeat(50));

if (failed > 0) {
  process.exit(1);
}
