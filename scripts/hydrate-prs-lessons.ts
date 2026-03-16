/**
 * scripts/hydrate-prs-lessons.ts
 *
 * Hydrates PRS curriculum_lessons rows with full instructional content.
 * Identity: lesson_slug (never title matching).
 * Fails loudly on any unmatched lesson.
 *
 * Usage:
 *   npx tsx scripts/hydrate-prs-lessons.ts          # dry run
 *   npx tsx scripts/hydrate-prs-lessons.ts --apply  # write to DB
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const PROGRAM_SLUG = 'peer-recovery-specialist-jri';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type LessonPayload = {
  lesson_slug: string;
  script_text: string;
  summary_text: string;
  reflection_prompt: string;
  key_terms: string[];
  competency_keys: string[];
  job_application: string;
  watch_for: string[];
};

// Content imported from separate file to keep this script manageable
import { PRS_LESSONS } from './prs-lesson-payloads';

async function main() {
  console.log(`\nPRS Lesson Hydration — mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Lessons in seed: ${PRS_LESSONS.length}\n`);

  if (PRS_LESSONS.length !== 39) {
    throw new Error(`Expected 39 lessons, got ${PRS_LESSONS.length}. Complete all lessons before running.`);
  }

  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .select('id, slug, title')
    .eq('slug', PROGRAM_SLUG)
    .single();

  if (progErr || !prog) {
    throw new Error(`Program "${PROGRAM_SLUG}" not found: ${progErr?.message}`);
  }
  console.log(`Program: ${prog.title} (${prog.id})\n`);

  const { data: dbRows, error: fetchErr } = await supabase
    .from('curriculum_lessons')
    .select('id, lesson_slug, lesson_title, competency_keys')
    .eq('program_id', prog.id);

  if (fetchErr) throw new Error(`DB fetch failed: ${fetchErr.message}`);

  const dbBySlug = new Map((dbRows ?? []).map(r => [r.lesson_slug, r]));
  console.log(`DB rows: ${dbRows?.length ?? 0}`);

  const matched: Array<{ id: string; lesson_slug: string; payload: object }> = [];
  const unresolved: string[] = [];

  for (const seed of PRS_LESSONS) {
    const row = dbBySlug.get(seed.lesson_slug);
    if (!row) {
      unresolved.push(seed.lesson_slug);
      continue;
    }
    const { lesson_slug, ...rest } = seed;
    matched.push({ id: row.id, lesson_slug, payload: { ...rest, updated_at: new Date().toISOString() } });
  }

  if (unresolved.length > 0) {
    console.error('\nUNRESOLVED lesson slugs (no DB match):');
    unresolved.forEach(s => console.error(`  ✗ ${s}`));
    throw new Error(`${unresolved.length} lesson(s) unresolved. Fix slugs before applying.`);
  }

  console.log(`\nMatched: ${matched.length} / ${PRS_LESSONS.length}`);
  matched.forEach(m => console.log(`  ✓ ${m.lesson_slug}`));

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to write changes.');
    return;
  }

  let updated = 0;
  for (const m of matched) {
    const { error } = await supabase
      .from('curriculum_lessons')
      .update(m.payload)
      .eq('id', m.id);
    if (error) throw new Error(`Update failed for "${m.lesson_slug}": ${error.message}`);
    updated++;
    console.log(`  ✅ ${m.lesson_slug}`);
  }

  const { count } = await supabase
    .from('curriculum_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', prog.id)
    .not('competency_keys', 'eq', '{}');

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`✅ Lessons with competency_keys populated: ${count} / ${dbRows?.length ?? 0}`);
}

main().catch(err => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
