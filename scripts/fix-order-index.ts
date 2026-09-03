/**
 * Fix order_index for all 69 barber course lessons.
 * Canonical order derived from seed files (module-1 through module-8).
 * Scheme: module N → order_index N*1000 + position (1-based)
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const DRY_RUN = process.argv.includes('--dry-run');

// Canonical order: [module, position, slug]
// Derived directly from seed files, in order
const ORDER: [number, number, string][] = [
  // Module 1 — Infection Control & Safety
  [1, 1, 'barber-lesson-1'],
  [1, 2, 'barber-lesson-2'],
  [1, 3, 'barber-lesson-3'],
  [1, 4, 'barber-lesson-4'],
  [1, 5, 'barber-lesson-5'],
  [1, 6, 'barber-lesson-6'],
  [1, 7, 'barber-life-skills'],
  [1, 8, 'barber-professional-image'],
  [1, 9, 'barber-communicating-for-success'],
  [1, 10, 'barber-healthy-professional'],
  [1, 11, 'barber-chemistry-chemical-safety-for-barbers'],
  [1, 12, 'barber-osha-workplace-safety'],
  [1, 13, 'barber-module-1-checkpoint'],

  // Module 2 — Hair Science & Scalp Analysis
  [2, 1, 'barber-lesson-8'],
  [2, 2, 'barber-lesson-9'],
  [2, 3, 'barber-lesson-10'],
  [2, 4, 'barber-lesson-11'],
  [2, 5, 'barber-lesson-12'],
  [2, 6, 'barber-lesson-13'],
  [2, 7, 'barber-anatomy-physiology-for-barbers'],
  [2, 8, 'barber-skin-structure-growth'],
  [2, 9, 'barber-skin-disorders-diseases'],
  [2, 10, 'barber-principles-of-hair-design'],
  [2, 11, 'barber-electricity-electrical-safety'],
  [2, 12, 'barber-hair-loss-services'],
  [2, 13, 'barber-module-2-checkpoint'],

  // Module 3 — Haircutting Fundamentals
  [3, 1, 'barber-lesson-15'],
  [3, 2, 'barber-lesson-16'],
  [3, 3, 'barber-lesson-17'],
  [3, 4, 'barber-lesson-18'],
  [3, 5, 'barber-lesson-19'],
  [3, 6, 'barber-lesson-20'],
  [3, 7, 'barber-trichology-hair-loss-science'],
  [3, 8, 'barber-module-3-checkpoint'],

  // Module 4 — Haircutting Techniques
  [4, 1, 'barber-lesson-22'],
  [4, 2, 'barber-lesson-23'],
  [4, 3, 'barber-lesson-24'],
  [4, 4, 'barber-lesson-25'],
  [4, 5, 'barber-lesson-26'],
  [4, 6, 'barber-lesson-27'],
  [4, 7, 'barber-module-4-checkpoint'],

  // Module 5 — Shaving & Beard Services
  [5, 1, 'barber-lesson-29'],
  [5, 2, 'barber-lesson-30'],
  [5, 3, 'barber-lesson-31'],
  [5, 4, 'barber-lesson-32'],
  [5, 5, 'barber-lesson-33'],
  [5, 6, 'barber-module-5-checkpoint'],

  // Module 6 — Chemical Services
  [6, 1, 'barber-lesson-35'],
  [6, 2, 'barber-lesson-36'],
  [6, 3, 'barber-lesson-37'],
  [6, 4, 'barber-lesson-38'],
  [6, 5, 'barber-module-6-checkpoint'],

  // Module 7 — Professional & Business Skills
  [7, 1, 'barber-lesson-40'],
  [7, 2, 'barber-lesson-41'],
  [7, 3, 'barber-lesson-42'],
  [7, 4, 'barber-lesson-43'],
  [7, 5, 'barber-lesson-44'],
  [7, 6, 'barber-haircoloring-application-procedures'],
  [7, 7, 'barber-permanent-waves-chemical-texture-services'],
  [7, 8, 'barber-nail-care-services'],
  [7, 9, 'barber-module-7-checkpoint'],

  // Module 8 — State Board Exam Preparation
  [8, 1, 'barber-lesson-46'],
  [8, 2, 'barber-lesson-47'],
  [8, 3, 'barber-lesson-48'],
  [8, 4, 'barber-lesson-49'],
  [8, 5, 'barber-hairstyling-curl-wave-texture-techniques'],
  [8, 6, 'barber-facial-treatments-massage-techniques'],
  [8, 7, 'barber-business-law-employment'],
  [8, 8, 'barber-indiana-state-board-exam'],
];

async function update(id: string, index: number): Promise<boolean> {
  const { error } = await sb.from('course_lessons').update({ order_index: index }).eq('id', id);
  if (error) {
    console.log(`  ❌ ${index}: ${error.message}`);
    return false;
  }
  return true;
}

async function main() {
  const { data: lessons, error } = await sb
    .from('course_lessons')
    .select('id, slug, order_index')
    .eq('course_id', COURSE_ID);

  if (error) {
    console.error('Fetch error:', error.message);
    process.exit(1);
  }

  const bySlug = new Map(lessons!.map((l) => [l.slug, l]));
  const canonicalSlugs = new Set(ORDER.map(([, , s]) => s));

  // Build target map
  const targets = new Map<string, number>(); // id → final order_index
  let missing = 0;
  for (const [mod, pos, slug] of ORDER) {
    const lesson = bySlug.get(slug);
    if (!lesson) {
      console.log(`❌ MISSING: ${slug}`);
      missing++;
      continue;
    }
    targets.set(lesson.id, mod * 1000 + pos);
  }

  if (DRY_RUN) {
    for (const [mod, pos, slug] of ORDER) {
      const lesson = bySlug.get(slug);
      if (!lesson) continue;
      const newIdx = mod * 1000 + pos;
      if (lesson.order_index !== newIdx)
        console.log(`  DRY  ${slug}: ${lesson.order_index} → ${newIdx}`);
    }
    console.log(`\nDry run complete. ${targets.size} lessons to update, ${missing} missing.`);
    return;
  }

  // Pass 1 — move everything to temp values (add 100000) to clear all conflicts
  console.log('Pass 1: moving to temp values...');
  let p1ok = 0;
  for (const [id, finalIdx] of targets) {
    const lesson = lessons!.find((l) => l.id === id)!;
    if (lesson.order_index === finalIdx) continue; // already correct, skip
    if (await update(id, finalIdx + 100000)) p1ok++;
  }
  console.log(`  Pass 1 done: ${p1ok} moved to temp`);

  // Pass 2 — move from temp to final values
  console.log('Pass 2: moving to final values...');
  let p2ok = 0,
    unchanged = 0;
  for (const [id, finalIdx] of targets) {
    const lesson = lessons!.find((l) => l.id === id)!;
    if (lesson.order_index === finalIdx) {
      unchanged++;
      continue;
    }
    if (await update(id, finalIdx)) {
      const slug = lessons!.find((l) => l.id === id)!.slug;
      console.log(`  ✅  ${slug} → ${finalIdx}`);
      p2ok++;
    }
  }

  const unaccounted = lessons!.filter((l) => !canonicalSlugs.has(l.slug));
  if (unaccounted.length) {
    console.log('\n⚠️  Lessons not in canonical list:');
    unaccounted.forEach((l) => console.log(`   ${l.order_index}  ${l.slug}`));
  }

  console.log(
    `\nDone. updated=${p2ok}  unchanged=${unchanged}  missing=${missing}  unaccounted=${unaccounted.length}`,
  );
}

main();
