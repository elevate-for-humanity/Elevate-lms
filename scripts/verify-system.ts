#!/usr/bin/env tsx
/**
 * Fast production-system invariants. Fails closed on missing required evidence.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;
let failed = 0;

const pass = (label: string) => { console.log(`  ✅  ${label}`); passed++; };
const fail = (label: string, detail?: string) => { console.error(`  ❌  ${label}${detail ? `\n       ${detail}` : ''}`); failed++; };
const section = (title: string) => console.log(`\n── ${title}`);

section('Environment variables');
for (const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SITE_URL']) {
  if (process.env[key]) pass(key); else fail(key, 'not set in process.env');
}

section('No hardcoded secrets');
const JWT_PATTERN = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}/;
const SOURCE_DIRS = ['app','apps','components','lib','packages','hooks','scripts'];
const SKIP_DIRS = new Set(['node_modules','.next','.git','dist','build','.turbo','coverage']);
const SKIP_EXT = new Set(['.png','.jpg','.jpeg','.webp','.gif','.mp4','.mp3','.pdf','.ico','.svg','.zip']);
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (!SKIP_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}
const jwtHits: string[] = [];
for (const dir of SOURCE_DIRS) for (const file of walk(path.join(ROOT, dir))) {
  try { if (JWT_PATTERN.test(fs.readFileSync(file, 'utf8'))) jwtHits.push(path.relative(ROOT, file)); } catch {}
}
if (jwtHits.length) fail(`Hardcoded JWT found in ${jwtHits.length} file(s)`, jwtHits.slice(0,5).join(', ')); else pass('No hardcoded JWTs found in active source trees');

section('Critical source files');
for (const candidates of [
  ['hooks/useVideoProgress.ts'],
  ['components/course/AutomaticCourseBuilder.tsx'],
  ['components/marketing/HeroVideo.tsx'],
  ['content/heroBanners.ts'],
  ['lib/supabase/server.ts'],
  ['lib/supabase/client.ts'],
  ['lib/api/safe-error.ts'],
  ['lib/api/withRateLimit.ts'],
]) {
  const hit = candidates.find((p) => fs.existsSync(path.join(ROOT, p)));
  if (hit) pass(hit); else fail(candidates.join(' or '), 'critical source file missing');
}

section('No dead hrefs');
const uiRoots = ['app','apps/marketing/app','apps/lms/app','apps/admin/app','apps/app','components'];
const dead: string[] = [];
for (const root of uiRoots) for (const file of walk(path.join(ROOT, root))) {
  if (!/\.(tsx|jsx)$/.test(file)) continue;
  try { if (/href=["']#["']/.test(fs.readFileSync(file,'utf8'))) dead.push(path.relative(ROOT,file)); } catch {}
}
if (dead.length) fail(`href="#" found in ${dead.length} UI file(s)`, dead.slice(0,5).join(', ')); else pass('No href="#" in active rendered UI trees');

section('Test coverage');
const courseBuilderTests = [
  'tests/e2e/course-builder.spec.ts',
  'tests/e2e/course-builder.spec.tsx',
  'e2e/course-builder.spec.ts',
].filter((p) => fs.existsSync(path.join(ROOT,p)));
if (courseBuilderTests.length) pass(`Course Builder E2E present: ${courseBuilderTests[0]}`); else fail('Course Builder E2E test missing');

console.log(`\n${'─'.repeat(50)}\n  ${passed} passed  |  ${failed} failed\n${'─'.repeat(50)}`);
if (failed > 0) process.exit(1);
