#!/usr/bin/env tsx
/**
 * Verify Barber Apprenticeship blueprint is ready for canonical seeding.
 *
 * Usage:
 *   pnpm tsx scripts/verify-barber-blueprint.ts
 *   pnpm tsx scripts/verify-barber-blueprint.ts --seed   # also run DB seed (needs .env.local)
 *
 * Canonical seed (production):
 *   pnpm tsx scripts/seed-course-from-blueprint.ts \
 *     --blueprint barber-apprenticeship-v1 \
 *     --program barber-apprenticeship \
 *     --mode missing-only
 *
 * Do NOT use scripts/generate-barber-course.ts — it conflicts with haircutting slugs 22–27.
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { barberApprenticeshipBlueprint } from '../lib/curriculum/blueprints/barber/index';
import { validateBlueprintLessons } from '../lib/curriculum/lqs-validator';
import { validateProductionContent } from '../lib/curriculum/builders/buildCanonicalCourseFromBlueprint';

const RUN_SEED = process.argv.includes('--seed');
const CANONICAL_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

function inferStepType(slug: string, lessonType?: string): string {
  if (lessonType) return lessonType;
  if (slug.includes('checkpoint')) return 'checkpoint';
  if (slug.includes('exam') || slug.includes('final')) return 'exam';
  return 'lesson';
}

async function main() {
  const bp = barberApprenticeshipBlueprint;
  const lessons = bp.modules.flatMap((m) => m.lessons ?? []);
  const slugs = lessons.map((l) => l.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);

  console.log('\n── Barber blueprint verification ───────────────────────');
  console.log(`Blueprint id     : ${bp.id}`);
  console.log(`Program slug       : ${bp.programSlug}`);
  console.log(`Modules            : ${bp.modules.length} (expected ${bp.expectedModuleCount})`);
  console.log(`Lessons            : ${lessons.length} (metadata expected ${bp.expectedLessonCount})`);
  console.log(`Video config       : ${bp.videoConfig?.template} / ${bp.videoConfig?.instructorName}`);

  if (bp.modules.length !== bp.expectedModuleCount) {
    console.warn(`⚠️  Module count mismatch: ${bp.modules.length} vs expectedModuleCount ${bp.expectedModuleCount}`);
  }
  if (lessons.length !== bp.expectedLessonCount) {
    console.warn(
      `⚠️  Lesson count mismatch: ${lessons.length} vs expectedLessonCount ${bp.expectedLessonCount} — update barber/index.ts`,
    );
  }
  if (dupes.length) {
    console.error('❌ Duplicate lesson slugs:', [...new Set(dupes)].join(', '));
    process.exit(1);
  }

  const lqs = validateBlueprintLessons(lessons);
  const lqsFail = lqs.filter((r) => !r.passed);
  if (lqsFail.length) {
    console.error(`❌ LQS failed on ${lqsFail.length} lesson(s)`);
    lqsFail.slice(0, 5).forEach((f) => console.error(`   ${f.slug}`));
    process.exit(1);
  }
  console.log(`✅ LQS passed (${lessons.length} lessons)`);

  let prodFail = 0;
  for (const l of lessons) {
    const step = inferStepType(l.slug, l.lessonType);
    const v = validateProductionContent(l, step);
    if (v.length) {
      prodFail++;
      console.error(`   ${l.slug}: ${v.map((x) => x.field).join(', ')}`);
    }
  }
  if (prodFail) {
    console.error(`❌ Production content validation failed on ${prodFail} lesson(s)`);
    process.exit(1);
  }
  console.log(`✅ Production content validation passed`);

  console.log('\nModules:');
  bp.modules.forEach((m) => {
    const count = m.lessons?.length ?? 0;
    console.log(`  [${m.orderIndex}] ${m.title} — ${count} lessons`);
  });

  console.log(`\nLive course audit id (scripts/audit-barber-course.ts): ${CANONICAL_COURSE_ID}`);
  console.log('\nSTATUS: Blueprint is ready to seed via buildCanonicalCourseFromBlueprint.\n');

  if (!RUN_SEED) {
    console.log('Run with --seed to execute seed-course-from-blueprint against Supabase.\n');
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const { execSync } = await import('child_process');
  execSync(
    'pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint barber-apprenticeship-v1 --program barber-apprenticeship --mode missing-only',
    { stdio: 'inherit', cwd: process.cwd(), env: process.env },
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
