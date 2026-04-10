/* eslint-disable no-console */
/**
 * Reads every module seed, validates that domain/ojtCategory/hoursCredit/
 * competencyChecks are present on every lesson and checkpoint, and reports
 * any missing fields. Does NOT rewrite files — used as a pre-generate check.
 *
 * Run: pnpm tsx scripts/course-builder/patch-seeds.ts
 */

import { barberCourseSeed } from './seeds/barber-course.seed';
import type { LessonSeed, CheckpointSeed, BarberDomain, OJTCategory } from './types';

const REQUIRED_DOMAINS: BarberDomain[] = [
  'infection_control',
  'hair_science',
  'haircutting',
  'shaving',
  'chemical_services',
  'laws_rules',
  'business',
  'exam_prep',
];

type LessonReport = {
  slug: string;
  missing: string[];
};

function roundToQuarter(n: number): number {
  return Math.round(n * 4) / 4;
}

function expectedHours(durationMin: number): number {
  return roundToQuarter(durationMin / 60);
}

function checkLesson(l: LessonSeed): string[] {
  const missing: string[] = [];
  if (!l.domain) missing.push('domain');
  if (!l.ojtCategory) missing.push('ojtCategory');
  if (l.hoursCredit === undefined || l.hoursCredit === null) missing.push('hoursCredit');
  if (!l.competencyChecks || l.competencyChecks.length === 0) missing.push('competencyChecks');
  else {
    const required = l.competencyChecks.filter(c => c.required);
    if (required.length < 3) missing.push(`competencyChecks.required<3 (has ${required.length})`);
    const missingIds = l.competencyChecks.filter(c => !c.id);
    if (missingIds.length) missing.push(`competencyChecks missing id on ${missingIds.length} items`);
  }
  const expectedHrs = expectedHours(l.durationMin);
  if (l.hoursCredit !== undefined && Math.abs(l.hoursCredit - expectedHrs) > 0.26) {
    missing.push(`hoursCredit=${l.hoursCredit} expected≈${expectedHrs} for ${l.durationMin}min`);
  }
  return missing;
}

function checkCheckpoint(c: CheckpointSeed): string[] {
  const missing: string[] = [];
  if (!c.domain) missing.push('domain');
  if (!c.ojtCategory) missing.push('ojtCategory');
  if (c.hoursCredit === undefined || c.hoursCredit === null) missing.push('hoursCredit');
  return missing;
}

function main(): void {
  const reports: LessonReport[] = [];
  let totalChecked = 0;
  let totalOk = 0;

  for (const mod of barberCourseSeed.modules) {
    for (const lesson of mod.lessons) {
      totalChecked++;
      const missing = checkLesson(lesson);
      if (missing.length) {
        reports.push({ slug: lesson.slug, missing });
      } else {
        totalOk++;
      }
    }
    if (mod.checkpoint) {
      totalChecked++;
      const missing = checkCheckpoint(mod.checkpoint);
      if (missing.length) {
        reports.push({ slug: mod.checkpoint.slug, missing });
      } else {
        totalOk++;
      }
    }
  }

  console.log(`\nSeed structural audit`);
  console.log(`─────────────────────`);
  console.log(`Total lessons/checkpoints: ${totalChecked}`);
  console.log(`Fully compliant:           ${totalOk}`);
  console.log(`Missing fields:            ${reports.length}`);

  if (reports.length) {
    console.log('\nIssues:');
    for (const r of reports) {
      console.log(`  ${r.slug}`);
      for (const m of r.missing) console.log(`    ✗ ${m}`);
    }
    console.log('\nFAIL: structural gaps found. Patch seeds before generating.');
    process.exit(1);
  }

  // Domain coverage check
  const domainCounts: Partial<Record<BarberDomain, number>> = {};
  for (const mod of barberCourseSeed.modules) {
    for (const l of mod.lessons) {
      domainCounts[l.domain] = (domainCounts[l.domain] ?? 0) + 1;
    }
  }
  const coveredDomains = Object.keys(domainCounts) as BarberDomain[];
  const missingDomains = REQUIRED_DOMAINS.filter(d => !coveredDomains.includes(d));

  console.log('\nDomain coverage:');
  for (const [d, count] of Object.entries(domainCounts)) {
    console.log(`  ${d}: ${count} lessons`);
  }
  if (missingDomains.length) {
    console.log(`\n✗ Missing domains: ${missingDomains.join(', ')}`);
    process.exit(1);
  }

  // OJT hours summary
  const ojtHours: Partial<Record<OJTCategory, number>> = {};
  let totalHours = 0;
  for (const mod of barberCourseSeed.modules) {
    for (const l of mod.lessons) {
      ojtHours[l.ojtCategory] = (ojtHours[l.ojtCategory] ?? 0) + l.hoursCredit;
      totalHours += l.hoursCredit;
    }
  }
  console.log('\nOJT hours by category:');
  for (const [cat, hrs] of Object.entries(ojtHours)) {
    console.log(`  ${cat}: ${hrs.toFixed(2)}h`);
  }
  console.log(`  TOTAL RTI hours: ${totalHours.toFixed(2)}h`);
  if (totalHours < 10) {
    console.warn('\n⚠ WARNING: total RTI hours below expected minimum (10h)');
  }

  console.log('\nPASS: all lessons structurally compliant.');
}

main();
