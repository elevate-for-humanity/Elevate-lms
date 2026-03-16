/**
 * scripts/hydrate-prs-lessons.ts
 *
 * Seeds PRS lesson rows in curriculum_lessons using prs-indiana blueprint.
 * Slugs are the identity. Title matching is not used.
 *
 * Usage:
 *   npx tsx scripts/hydrate-prs-lessons.ts          # dry run
 *   npx tsx scripts/hydrate-prs-lessons.ts --apply  # write to DB
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { prsIndianaBlueprint } from '../lib/curriculum/blueprints/prs-indiana';

const APPLY = process.argv.includes('--apply');
const PROGRAM_ID = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d'; // peer-recovery-specialist-jri

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Flatten blueprint into ordered rows
const blueprintLessons = prsIndianaBlueprint.modules.flatMap(mod =>
  mod.lessons.map(lesson => ({
    moduleKey:   mod.key,
    moduleTitle: mod.title,
    moduleOrder: mod.order,
    domainKey:   lesson.domainKey,
    slug:        lesson.slug,
    title:       lesson.title,
    lessonOrder: lesson.order,
  }))
);

// Guard: fail at script load if blueprint count is wrong
if (blueprintLessons.length !== prsIndianaBlueprint.expectedLessonCount) {
  throw new Error(
    `Blueprint flattened to ${blueprintLessons.length} lessons, expected ${prsIndianaBlueprint.expectedLessonCount}`
  );
}

async function main() {
  console.log(`\nPRS Lesson Hydration — mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Blueprint: ${prsIndianaBlueprint.id} v${prsIndianaBlueprint.version}`);
  console.log(`Modules: ${prsIndianaBlueprint.expectedModuleCount}  Lessons: ${blueprintLessons.length}\n`);

  // Load existing DB rows for this program
  const { data: existing, error: fetchErr } = await supabase
    .from('curriculum_lessons')
    .select('id, slug, title, module_title, competency_keys')
    .eq('program_id', PROGRAM_ID);

  if (fetchErr) throw new Error(`DB fetch failed: ${fetchErr.message}`);

  const dbBySlug = new Map((existing ?? []).map(r => [r.slug, r]));
  const dbByTitle = new Map((existing ?? []).map(r => [r.title?.trim().toLowerCase(), r]));

  console.log(`DB rows found: ${existing?.length ?? 0}`);
  console.log(`Blueprint lessons: ${blueprintLessons.length}\n`);

  const toUpdate: Array<{ id: string; slug: string; title: string; payload: object }> = [];
  const toInsert: Array<object> = [];
  const unresolved: string[] = [];

  for (const bp of blueprintLessons) {
    // Match by slug first (durable identity), fall back to title for migration
    const bySlug  = dbBySlug.get(bp.slug);
    const byTitle = dbByTitle.get(bp.title.trim().toLowerCase());
    const row     = bySlug ?? byTitle;

    const payload = {
      slug:         bp.slug,
      module_title: bp.moduleTitle,
      module_order: bp.moduleOrder,
      lesson_order: bp.lessonOrder,
      domain_key:   bp.domainKey,
      program_id:   PROGRAM_ID,
      status:       'published',
      updated_at:   new Date().toISOString(),
    };

    if (row) {
      toUpdate.push({ id: row.id, slug: bp.slug, title: bp.title, payload });
    } else {
      toInsert.push({ ...payload, title: bp.title });
    }
  }

  // Print plan
  console.log('── UPDATE (existing rows) ──────────────────────────');
  for (const u of toUpdate) {
    console.log(`  ✓ [${u.slug}] ${u.title}`);
  }

  if (toInsert.length > 0) {
    console.log('\n── INSERT (new rows) ───────────────────────────────');
    for (const ins of toInsert as any[]) {
      console.log(`  + [${ins.slug}] ${ins.title}`);
    }
  }

  if (unresolved.length > 0) {
    console.error('\n── UNRESOLVED (blueprint lessons with no DB match) ──');
    for (const u of unresolved) console.error(`  ✗ ${u}`);
    throw new Error(`${unresolved.length} blueprint lesson(s) could not be resolved. Fix before applying.`);
  }

  console.log(`\nSummary: ${toUpdate.length} update(s), ${toInsert.length} insert(s)`);

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to write changes.');
    return;
  }

  // Apply updates
  let updated = 0;
  let inserted = 0;

  for (const u of toUpdate) {
    const { error } = await supabase
      .from('curriculum_lessons')
      .update(u.payload)
      .eq('id', u.id);
    if (error) throw new Error(`Update failed for "${u.slug}": ${error.message}`);
    updated++;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('curriculum_lessons')
      .insert(toInsert);
    if (error) throw new Error(`Insert failed: ${error.message}`);
    inserted = toInsert.length;
  }

  // Verify final count
  const { count, error: countErr } = await supabase
    .from('curriculum_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', PROGRAM_ID);

  if (countErr) throw new Error(`Verification query failed: ${countErr.message}`);

  console.log(`\n✅ Applied: ${updated} updated, ${inserted} inserted`);
  console.log(`✅ DB now has ${count} PRS lessons`);

  if (count !== prsIndianaBlueprint.expectedLessonCount) {
    console.warn(`⚠️  Expected ${prsIndianaBlueprint.expectedLessonCount}, got ${count} — investigate duplicates`);
  }
}

main().catch(err => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
