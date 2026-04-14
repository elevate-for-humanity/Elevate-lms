/**
 * Bulk-seeds learning_objectives, competency_checks, instructor_notes,
 * practical_required, and video_url for all barber course lessons from
 * the blueprint into course_lessons.
 *
 * Safe to re-run — skips lessons that already have learning_objectives set.
 * Use --force to overwrite all.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/seed-barber-objectives.ts
 *   pnpm tsx --env-file=.env.local scripts/seed-barber-objectives.ts --force
 */

import { createClient } from '@supabase/supabase-js';
import { barberApprenticeshipBlueprint } from '../lib/curriculum/blueprints/barber-apprenticeship';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const FORCE = process.argv.includes('--force');

// Flatten all lessons from all modules into a slug → lesson map
function buildBlueprintMap() {
  const map = new Map<string, any>();
  for (const mod of barberApprenticeshipBlueprint.modules) {
    for (const lesson of mod.lessons) {
      map.set(lesson.slug, lesson);
    }
  }
  return map;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase env vars not set.'); process.exit(1);
  }

  const blueprintMap = buildBlueprintMap();
  console.log(`\nBlueprint lessons: ${blueprintMap.size}`);

  // Fetch all DB rows for this course
  const { data: rows, error } = await db
    .from('course_lessons')
    .select('id, slug, learning_objectives')
    .eq('course_id', BARBER_COURSE_ID)
    .order('order_index');

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`DB lessons: ${rows?.length}`);

  let updated = 0, skipped = 0, missing = 0;

  for (const row of rows ?? []) {
    const lesson = blueprintMap.get(row.slug);

    if (!lesson) {
      console.log(`  ⚠️  ${row.slug} — not in blueprint, skipping`);
      missing++;
      continue;
    }

    // Skip if already has objectives and not forcing
    if (!FORCE && row.learning_objectives) {
      skipped++;
      continue;
    }

    const learningObjectives: string[] = lesson.learningObjectives ?? deriveObjectives(lesson);
    const competencyChecks = lesson.competencyChecks ?? null;
    const instructorNotes = lesson.instructorNotes ?? null;
    const practicalRequired = !!(competencyChecks?.some((c: any) => c.requiresInstructorSignoff));

    const { error: updateErr } = await db
      .from('course_lessons')
      .update({
        learning_objectives: learningObjectives,
        competency_checks:   competencyChecks,
        instructor_notes:    instructorNotes,
        practical_required:  practicalRequired,
        video_url:           lesson.videoFile ?? null,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateErr) {
      console.error(`  ❌ ${row.slug}: ${updateErr.message}`);
    } else {
      console.log(`  ✅ ${row.slug} — ${learningObjectives.length} objectives${practicalRequired ? ' + practical required' : ''}`);
      updated++;
    }
  }

  console.log(`\n=== Done === updated=${updated} | skipped=${skipped} | not-in-blueprint=${missing}`);
}

/**
 * Derives learning objectives from the lesson's objective string when
 * explicit learningObjectives are not defined in the blueprint.
 * Splits on semicolons and sentence boundaries to produce a clean list.
 */
function deriveObjectives(lesson: any): string[] {
  const raw: string = lesson.objective ?? '';
  if (!raw) return [`Complete ${lesson.title}`];

  // Split on semicolons first, then on '; ' patterns
  const parts = raw
    .split(/;\s*/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 10);

  if (parts.length >= 2) return parts;

  // Fall back to splitting on '. ' for single-sentence objectives
  return raw
    .split(/\.\s+/)
    .map((s: string) => s.trim().replace(/\.$/, ''))
    .filter((s: string) => s.length > 10);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
