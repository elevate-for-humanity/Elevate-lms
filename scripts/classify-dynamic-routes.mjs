#!/usr/bin/env node
/**
 * classify-dynamic-routes.mjs
 *
 * Scans every file with `force-dynamic` and classifies it as:
 *   STATIC   → safe to remove force-dynamic entirely (no revalidate needed)
 *   ISR_3600 → safe to set revalidate = 3600 (public, changes occasionally)
 *   ISR_86400→ safe to set revalidate = 86400 (public, rarely changes)
 *   DYNAMIC  → must stay force-dynamic (reads auth session or user-specific data)
 *   REVIEW   → ambiguous — needs human eyes
 *
 * Classification rules (in priority order):
 *   DYNAMIC  if file contains any auth signal:
 *              getUser() | getSession() | auth.uid() | createClient() from server
 *              AND is in an authenticated path segment
 *   DYNAMIC  if path contains: /admin/ /learner/ /student-portal/ /partner-portal/
 *              /employer-portal/ /staff-portal/ /mentor/ /instructor/ /program-holder/
 *              /apprentice/ /lms/(app)/ /pwa/ /profile/ /cart/ /checkout/ /payment/
 *   ISR      if path is public-facing program/marketing content
 *   STATIC   if path is fully static (no DB reads at all)
 *   REVIEW   everything else
 *
 * Output: classify-dynamic-routes.json + human-readable summary
 *
 * Usage: node scripts/classify-dynamic-routes.mjs [--apply]
 *   --apply  actually rewrites files (dry-run by default)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const ONLY_SUMMARY = process.argv.includes('--summary');

// ── Auth signals — any of these means the page reads per-user data ────────────
const AUTH_SIGNALS = [
  /createClient\(\s*\)\s*\n.*auth/s,          // createClient then .auth
  /supabase\.auth\.getUser/,
  /supabase\.auth\.getSession/,
  /await\s+createClient\(\)/,                  // server client (implies auth context)
  /from\('@\/lib\/supabase\/server'\)/,
  /from\("@\/lib\/supabase\/server"\)/,
  /apiAuthGuard/,
  /apiRequireAdmin/,
  /authGuard/,
  /getServerSession/,
  /cookies\(\)/,                               // reading cookies = session-aware
  /headers\(\)/,                               // reading headers = request-aware
];

// ── Path segments that are always authenticated ───────────────────────────────
const ALWAYS_DYNAMIC_PATHS = [
  '/admin/',
  '/learner/',
  '/student-portal/',
  '/partner-portal/',
  '/employer-portal/',
  '/staff-portal/',
  '/mentor/',
  '/instructor/',
  '/program-holder/',
  '/apprentice/',
  '/lms/(app)/',
  '/lms/app/',
  '/pwa/',
  '/profile/',
  '/cart/',
  '/checkout/',
  '/payment/',
  '/onboarding/',
  '/account/',
  '/settings/',
  '/notifications/',
  '/messages/',
  '/timeclock/',
  '/competencies/',
  '/documents/',
  '/hours/',
];

// ── Path segments that are always public ─────────────────────────────────────
const ALWAYS_PUBLIC_PATHS = [
  '/programs/',
  '/courses/',
  '/about/',
  '/contact/',
  '/blog/',
  '/news/',
  '/events/',
  '/team/',
  '/careers/',
  '/faq/',
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/workforce-partners/',
  '/rise-foundation/',
  '/supersonic/',
  '/verify/',
  '/lms/programs/',
];

// ── ISR TTL heuristics ────────────────────────────────────────────────────────
const ISR_86400_SIGNALS = [
  '/about/', '/team/', '/faq/', '/privacy/', '/terms/', '/accessibility/',
  '/careers/', '/blog/', '/news/',
];

// ── Collect all files with force-dynamic ─────────────────────────────────────
function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if ((entry.endsWith('.tsx') || entry.endsWith('.ts')) && !entry.includes('.test.')) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = walk(join(ROOT, 'app'));
const dynamicFiles = allFiles.filter(f => {
  const content = readFileSync(f, 'utf8');
  return content.includes("'force-dynamic'") || content.includes('"force-dynamic"');
});

// ── Classify each file ────────────────────────────────────────────────────────
function classify(filePath) {
  const rel = '/' + relative(ROOT, filePath).replace(/\\/g, '/');
  const content = readFileSync(filePath, 'utf8');

  // 1. Always-dynamic path segments
  if (ALWAYS_DYNAMIC_PATHS.some(p => rel.includes(p))) {
    return { classification: 'DYNAMIC', reason: 'authenticated path segment' };
  }

  // 2. Auth signals in content
  const hasAuthSignal = AUTH_SIGNALS.some(re => re.test(content));
  if (hasAuthSignal) {
    return { classification: 'DYNAMIC', reason: 'auth signal in content' };
  }

  // 3. API routes — classify separately
  if (rel.includes('/api/')) {
    // Public API routes (no auth guard) can have cache headers added
    // but should stay dynamic for correctness — flag for cache-header addition
    return { classification: 'API_PUBLIC', reason: 'api route, no auth signal detected' };
  }

  // 4. Always-public paths
  if (ALWAYS_PUBLIC_PATHS.some(p => rel.includes(p))) {
    const ttl = ISR_86400_SIGNALS.some(p => rel.includes(p)) ? 86400 : 3600;
    return { classification: `ISR_${ttl}`, reason: 'public path segment' };
  }

  // 5. Has DB reads but no auth — ISR candidate
  const hasDbRead = content.includes('.from(') || content.includes('supabase');
  if (hasDbRead) {
    return { classification: 'ISR_3600', reason: 'db reads, no auth signal' };
  }

  // 6. No DB reads at all — fully static
  return { classification: 'STATIC', reason: 'no db reads, no auth signal' };
}

const results = dynamicFiles.map(f => {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const { classification, reason } = classify(f);
  return { file: rel, classification, reason };
});

// ── Summary ───────────────────────────────────────────────────────────────────
const counts = {};
for (const r of results) {
  counts[r.classification] = (counts[r.classification] || 0) + 1;
}

console.log('\n=== force-dynamic classification ===\n');
console.log(`Total files scanned: ${dynamicFiles.length}`);
console.log('');
for (const [cls, count] of Object.entries(counts).sort((a,b) => b[1]-a[1])) {
  const action = {
    DYNAMIC:    '→ keep force-dynamic',
    ISR_3600:   '→ revalidate = 3600',
    ISR_86400:  '→ revalidate = 86400',
    STATIC:     '→ remove force-dynamic',
    API_PUBLIC: '→ add Cache-Control header',
    REVIEW:     '→ needs human review',
  }[cls] ?? '';
  console.log(`  ${cls.padEnd(12)} ${String(count).padStart(5)}  ${action}`);
}

// ── Write JSON output ─────────────────────────────────────────────────────────
const outPath = join(ROOT, 'scripts', 'classify-dynamic-routes.json');
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nFull results written to scripts/classify-dynamic-routes.json`);

if (!ONLY_SUMMARY) {
  // Print first 20 of each non-dynamic class
  for (const cls of ['STATIC', 'ISR_3600', 'ISR_86400', 'API_PUBLIC']) {
    const group = results.filter(r => r.classification === cls).slice(0, 20);
    if (group.length === 0) continue;
    console.log(`\n--- ${cls} (first 20 of ${counts[cls] ?? 0}) ---`);
    for (const r of group) console.log(`  ${r.file}`);
  }
}

// ── Apply rewrites ────────────────────────────────────────────────────────────
if (APPLY) {
  let applied = 0;
  let skipped = 0;

  for (const r of results) {
    const fullPath = join(ROOT, r.file);
    const content = readFileSync(fullPath, 'utf8');

    if (r.classification === 'STATIC') {
      // Remove force-dynamic line entirely
      const updated = content
        .replace(/^export const dynamic = ['"]force-dynamic['"];\n?/m, '')
        .replace(/^export const dynamic = ['"]force-dynamic['"];\r?\n?/m, '');
      if (updated !== content) {
        writeFileSync(fullPath, updated);
        applied++;
      } else {
        skipped++;
      }
    } else if (r.classification === 'ISR_3600') {
      const updated = content
        .replace(
          /export const dynamic = ['"]force-dynamic['"];/,
          "export const revalidate = 3600;"
        );
      if (updated !== content) {
        writeFileSync(fullPath, updated);
        applied++;
      } else {
        skipped++;
      }
    } else if (r.classification === 'ISR_86400') {
      const updated = content
        .replace(
          /export const dynamic = ['"]force-dynamic['"];/,
          "export const revalidate = 86400;"
        );
      if (updated !== content) {
        writeFileSync(fullPath, updated);
        applied++;
      } else {
        skipped++;
      }
    }
    // DYNAMIC and API_PUBLIC: leave untouched
  }

  console.log(`\n=== Applied ===`);
  console.log(`  Rewrote: ${applied} files`);
  console.log(`  Skipped: ${skipped} files (no match found)`);
  console.log(`  Left dynamic: ${counts['DYNAMIC'] ?? 0} files`);
}
