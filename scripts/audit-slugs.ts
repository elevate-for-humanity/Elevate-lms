/**
 * scripts/audit-slugs.ts
 *
 * Slug audit across program files, program registry, LMS routes, and DB.
 * Outputs a structured mismatch report.
 *
 * Usage:
 *   npx tsx scripts/audit-slugs.ts              # code-only audit (no DB)
 *   npx tsx scripts/audit-slugs.ts --db          # include live DB check
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_PROGRAMS } from '../data/programs/catalog';
import { SLUG_ALIASES, resolveProgram } from '../lib/program-registry';

const CHECK_DB = process.argv.includes('--db');

// ── 1. Build program file slug map ───────────────────────────────────────────

interface ProgramAuditRow {
  programFileSlug: string;
  lmsCourseSlug: string | null;
  registrySlug: string | null;
  pageExists: boolean;
  applyHref: string;
  requestInfoHref: string;
  deliveryModel: string;
  dbSlug?: string | null;   // populated if --db
  dbCourseId?: string | null;
  status: 'OK' | 'MISMATCH' | 'MISSING_PAGE' | 'MISSING_REGISTRY' | 'MISSING_LMS_SLUG';
  issues: string[];
}

const rows: ProgramAuditRow[] = [];

for (const p of ALL_PROGRAMS) {
  const issues: string[] = [];

  // Registry lookup
  const registryEntry = resolveProgram(p.slug);
  const registrySlug = registryEntry?.slug ?? null;

  // Page existence
  const pageExists = fs.existsSync(path.join('app/programs', p.slug, 'page.tsx'));

  // lmsCourseSlug
  const lmsCourseSlug = (p as any).lmsCourseSlug ?? null;

  // Checks
  if (!pageExists) issues.push('NO_PAGE');
  if (!registrySlug) issues.push('NOT_IN_REGISTRY');
  if (registrySlug && registrySlug !== p.slug) issues.push(`REGISTRY_SLUG_MISMATCH: registry=${registrySlug}`);
  if ((p as any).deliveryModel === 'internal' && !lmsCourseSlug) issues.push('INTERNAL_MISSING_LMS_SLUG');
  if ((p as any).deliveryModel === 'hybrid' && !lmsCourseSlug) issues.push('HYBRID_MISSING_LMS_SLUG');
  if (lmsCourseSlug && lmsCourseSlug !== p.slug) issues.push(`LMS_SLUG_DIFFERS: lmsCourseSlug=${lmsCourseSlug}`);

  const applyHref = p.cta?.applyHref ?? '';
  if (applyHref === '/apply' || applyHref === '') issues.push('BARE_APPLY_HREF');

  let status: ProgramAuditRow['status'] = 'OK';
  if (issues.some(i => i.startsWith('LMS_SLUG_DIFFERS') || i.startsWith('REGISTRY_SLUG_MISMATCH'))) status = 'MISMATCH';
  else if (issues.includes('NO_PAGE')) status = 'MISSING_PAGE';
  else if (issues.includes('NOT_IN_REGISTRY')) status = 'MISSING_REGISTRY';
  else if (issues.some(i => i.includes('MISSING_LMS_SLUG'))) status = 'MISSING_LMS_SLUG';

  rows.push({
    programFileSlug: p.slug,
    lmsCourseSlug,
    registrySlug,
    pageExists,
    applyHref,
    requestInfoHref: p.cta?.requestInfoHref ?? '',
    deliveryModel: (p as any).deliveryModel ?? 'unknown',
    status,
    issues,
  });
}

// ── 2. DB check (optional) ────────────────────────────────────────────────────

if (CHECK_DB) {
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: courses } = await db
    .from('training_courses')
    .select('id, slug, course_name')
    .order('slug');

  const dbSlugMap = new Map<string, { id: string; name: string }>();
  for (const c of courses ?? []) {
    dbSlugMap.set(c.slug, { id: c.id, name: c.course_name });
  }

  for (const row of rows) {
    const lmsSlug = row.lmsCourseSlug ?? row.programFileSlug;
    const dbEntry = dbSlugMap.get(lmsSlug) ?? dbSlugMap.get(row.programFileSlug);
    row.dbSlug = dbEntry ? lmsSlug : null;
    row.dbCourseId = dbEntry?.id ?? null;

    if (row.deliveryModel === 'internal' || row.deliveryModel === 'hybrid') {
      if (!dbEntry) {
        row.issues.push('NOT_IN_DB');
        if (row.status === 'OK') row.status = 'MISMATCH';
      } else if (row.lmsCourseSlug && !dbSlugMap.has(row.lmsCourseSlug)) {
        row.issues.push(`DB_SLUG_NOT_FOUND: lmsCourseSlug=${row.lmsCourseSlug}`);
        if (row.status === 'OK') row.status = 'MISMATCH';
      }
    }
  }
}

// ── 3. Output ─────────────────────────────────────────────────────────────────

const ACTIVE_SLUGS = [
  'hvac-technician', 'bookkeeping', 'peer-recovery-specialist',
  'barber-apprenticeship', 'beauty-career-educator', 'business-administration',
  'cpr-first-aid', 'emergency-health-safety', 'home-health-aide',
  'medical-assistant', 'esthetician', 'cosmetology-apprenticeship',
];

let okCount = 0, issueCount = 0;

console.log('\n=== SLUG AUDIT REPORT ===\n');
console.log('Priority programs (11 active):\n');

for (const slug of ACTIVE_SLUGS) {
  const row = rows.find(r => r.programFileSlug === slug);
  if (!row) {
    console.log(`PROGRAM: ${slug}`);
    console.log(`  status: ❌ NOT IN CATALOG`);
    issueCount++;
    continue;
  }
  printRow(row);
  row.status === 'OK' ? okCount++ : issueCount++;
}

console.log('\n\nAll other programs:\n');
for (const row of rows) {
  if (ACTIVE_SLUGS.includes(row.programFileSlug)) continue;
  printRow(row);
  row.status === 'OK' ? okCount++ : issueCount++;
}

console.log(`\n=== SUMMARY ===`);
console.log(`OK:     ${okCount}`);
console.log(`Issues: ${issueCount}`);
console.log(`Total:  ${rows.length}`);

if (issueCount === 0) {
  console.log('\n✅ All slugs are canonical. No mismatches.');
} else {
  console.log('\n⚠️  Mismatches found. Fix before proceeding to Block 3.');
}

function printRow(row: ProgramAuditRow) {
  const icon = row.status === 'OK' ? '✅' : '⚠️ ';
  console.log(`PROGRAM: ${row.programFileSlug}`);
  console.log(`  program file slug : ${row.programFileSlug}`);
  console.log(`  lmsCourseSlug     : ${row.lmsCourseSlug ?? '(none)'}`);
  console.log(`  registry slug     : ${row.registrySlug ?? '(not registered)'}`);
  console.log(`  page              : ${row.pageExists ? '/programs/' + row.programFileSlug : '❌ MISSING'}`);
  console.log(`  deliveryModel     : ${row.deliveryModel}`);
  console.log(`  applyHref         : ${row.applyHref}`);
  if (row.dbSlug !== undefined) {
    console.log(`  DB slug           : ${row.dbSlug ?? '(not in DB)'}`);
  }
  console.log(`  status            : ${icon} ${row.status}`);
  if (row.issues.length > 0) {
    for (const issue of row.issues) {
      console.log(`    ⚠️  ${issue}`);
    }
  }
  console.log('');
}
