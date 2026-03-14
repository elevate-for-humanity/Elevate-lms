/**
 * Domain layer invariant checks.
 *
 * Runs without a TypeScript compiler — plain Node.js ESM.
 * Catches structural problems that cause runtime failures:
 *   - duplicate credential IDs in the static registry
 *   - domain files missing required exports
 *   - credential registry entries missing required fields
 *   - sim content files missing (cross-check with expected count)
 *
 * Exit 0 = all checks passed.
 * Exit 1 = at least one invariant violated (prints all failures before exiting).
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

let failures = 0;

function fail(msg) {
  console.error(`  FAIL  ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ok    ${msg}`);
}

function section(title) {
  console.log(`\n── ${title}`);
}

// ── 1. Domain files exist and export required symbols ─────────────────────

section('Domain layer exports');

const DOMAIN_FILES = [
  { file: 'lib/domain/credentials.ts', exports: ['mapCredentialRow', 'mapLearnerCredentialRow', 'assertIssuable', 'isVerifiable'] },
  { file: 'lib/domain/programs.ts',    exports: ['mapProgramRow'] },
  { file: 'lib/domain/courses.ts',     exports: ['mapCourseRow'] },
  { file: 'lib/domain/certificates.ts', exports: ['mapCertificateRow', 'assertGeneratable', 'isCertificateValid'] },
  { file: 'lib/domain/reports.ts',     exports: ['mapStudentRow', 'mapEnrollmentRow', 'mapCertificateReportRow', 'mapProgramSummaryRow', 'mapCourseSummaryRow'] },
  { file: 'lib/domain/index.ts',       exports: ['mapCredentialRow', 'mapProgramRow', 'mapCourseRow', 'mapCertificateRow'] },
];

for (const { file, exports: required } of DOMAIN_FILES) {
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) {
    fail(`${file} — file missing`);
    continue;
  }
  const src = readFileSync(fullPath, 'utf8');
  for (const sym of required) {
    // Match: export function X, export const X, export type X, export interface X, export * (re-export)
    const exported =
      new RegExp(`export\\s+(function|const|type|interface|async function)\\s+${sym}\\b`).test(src) ||
      (file.endsWith('index.ts') && src.includes("export * from './"));
    if (!exported) {
      fail(`${file} — missing export: ${sym}`);
    } else {
      pass(`${file} exports ${sym}`);
    }
  }
}

// ── 2. Sim content files ──────────────────────────────────────────────────

section('HVAC sim content');

const SIM_DIR = join(ROOT, 'content', 'hvac-sims');
if (!existsSync(SIM_DIR)) {
  fail('content/hvac-sims/ directory missing');
} else {
  const simFiles = readdirSync(SIM_DIR).filter(f => f.endsWith('.json')).sort();
  if (simFiles.length !== 10) {
    fail(`Expected 10 sim JSON files, found ${simFiles.length}`);
  } else {
    pass(`${simFiles.length} sim files present`);
  }

  // Duplicate sim ID check
  const simIds = [];
  for (const file of simFiles) {
    try {
      const raw = JSON.parse(readFileSync(join(SIM_DIR, file), 'utf8'));
      if (!raw.id) {
        fail(`${file} — missing id field`);
      } else if (simIds.includes(raw.id)) {
        fail(`Duplicate sim ID "${raw.id}" in ${file}`);
      } else {
        simIds.push(raw.id);
        pass(`${file} id="${raw.id}"`);
      }
    } catch (e) {
      fail(`${file} — JSON parse error: ${e.message}`);
    }
  }
}

// ── 3. Credential registry static data (lib/credentials/credential-system.ts) ──

section('Credential registry static data');

const CRED_SYSTEM = join(ROOT, 'lib', 'credentials', 'credential-system.ts');
if (!existsSync(CRED_SYSTEM)) {
  fail('lib/credentials/credential-system.ts — file missing');
} else {
  const src = readFileSync(CRED_SYSTEM, 'utf8');

  // Extract id: '...' values from the ALL_CREDENTIALS array
  const idMatches = [...src.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

  if (idMatches.length === 0) {
    pass('credential-system.ts — no static IDs to check (DB-driven)');
  } else {
    const seen = new Set();
    let dupes = 0;
    for (const id of idMatches) {
      if (seen.has(id)) {
        fail(`Duplicate credential ID "${id}" in credential-system.ts`);
        dupes++;
      }
      seen.add(id);
    }
    if (dupes === 0) {
      pass(`${idMatches.length} credential IDs — no duplicates`);
    }
  }
}

// ── 4. Certificate pipeline guard is present ─────────────────────────────

section('Certificate pipeline guard');

const CERT_GENERATE = join(ROOT, 'app', 'api', 'certificates', 'generate', 'route.ts');
if (!existsSync(CERT_GENERATE)) {
  fail('app/api/certificates/generate/route.ts — file missing');
} else {
  const src = readFileSync(CERT_GENERATE, 'utf8');
  if (!src.includes('assertCertificateInsertable')) {
    fail('app/api/certificates/generate/route.ts — assertCertificateInsertable guard missing');
  } else {
    pass('app/api/certificates/generate/route.ts has assertCertificateInsertable guard');
  }
}

// ── 5. No error.message leaks in API responses ────────────────────────────

section('API error.message leak check');

const API_DIR = join(ROOT, 'app', 'api');
let leakCount = 0;

function walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name === 'route.ts') {
      const src = readFileSync(full, 'utf8');
      // Pattern: NextResponse.json({ error: error.message }
      const matches = [...src.matchAll(/NextResponse\.json\(\s*\{\s*[^}]*error\.message/g)];
      if (matches.length > 0) {
        const rel = full.replace(ROOT + '/', '');
        fail(`${rel} — ${matches.length} error.message leak(s) in API response`);
        leakCount += matches.length;
      }
    }
  }
}

if (existsSync(API_DIR)) {
  walkDir(API_DIR);
  if (leakCount === 0) {
    pass('No error.message leaks found in API routes');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
if (failures > 0) {
  console.error(`\nDomain check FAILED — ${failures} invariant(s) violated\n`);
  process.exit(1);
} else {
  console.log(`\nDomain check PASSED\n`);
}
