/**
 * scripts/apply-forklift-simulation.ts
 *
 * Attaches the forklift pre-operation inspection + safe load handling
 * simulation (FORKLIFT_INSPECTION_LOAD_SIMULATION,
 * lib/lms/forklift-simulation.ts) to one lesson of the Forklift and
 * Manufacturing Operations course by merging it into the lesson's
 * content_json.experience.simulation — the slot the learner interactions
 * API surfaces as the `${lessonSlug}-simulation` interaction and scores
 * server-side into interaction_progress.
 *
 * The intended target is the course's pre-operation inspection lesson,
 * `forklift-03` ("Pre-use observations and workplace hazard decisions").
 *
 * DRY-RUN BY DEFAULT. A bare run prints the plan and never opens a
 * database connection. Pass --lesson <lesson-slug> to preview the exact
 * merge against the live lesson row (read-only), and --apply to write.
 * An existing simulation with a different simulator key is never
 * overwritten unless --force is also passed.
 *
 * Usage:
 *   pnpm tsx scripts/apply-forklift-simulation.ts
 *   pnpm tsx scripts/apply-forklift-simulation.ts --lesson forklift-03
 *   pnpm tsx scripts/apply-forklift-simulation.ts --lesson forklift-03 --apply
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import {
  FORKLIFT_INSPECTION_LOAD_SIMULATION,
  FORKLIFT_SIMULATOR_KEY,
} from '../lib/lms/forklift-simulation';

const COURSE_SLUG = 'forklift-manufacturing-operations-48h';
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const LESSON_SLUG = (() => {
  const i = process.argv.indexOf('--lesson');
  return i !== -1 ? process.argv[i + 1] : null;
})();

function printPlan() {
  const sim = FORKLIFT_INSPECTION_LOAD_SIMULATION;
  console.log('Forklift inspection & load simulation — attach plan');
  console.log(`  course slug : ${COURSE_SLUG}`);
  console.log(`  simulator   : ${FORKLIFT_SIMULATOR_KEY}`);
  console.log(`  title       : ${sim.title}`);
  console.log(`  writes to   : course_lessons.content_json.experience.simulation`);
  console.log('  syllabus topics evidenced:');
  for (const entry of sim.syllabusTopics) {
    console.log(`    - [${entry.coverage}] ${entry.topic}`);
  }
}

async function main() {
  printPlan();

  if (!LESSON_SLUG) {
    console.log(
      '\nNo --lesson <lesson-slug> given: nothing else to do. ' +
        'Re-run with a lesson slug to preview the merge (dry-run) or attach it (--apply). ' +
        'The intended target is forklift-03.',
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local).',
    );
  }
  const supabase = createClient(url, serviceKey);

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', COURSE_SLUG)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) throw new Error(`Course not found for slug ${COURSE_SLUG}`);

  const { data: lesson, error: lessonError } = await supabase
    .from('course_lessons')
    .select('id, slug, title, content_json')
    .eq('course_id', course.id)
    .eq('slug', LESSON_SLUG)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) {
    throw new Error(`Lesson ${LESSON_SLUG} not found in course ${COURSE_SLUG} (${course.id})`);
  }

  const contentJson =
    lesson.content_json && typeof lesson.content_json === 'object'
      ? (lesson.content_json as Record<string, any>)
      : {};
  const experience =
    contentJson.experience && typeof contentJson.experience === 'object'
      ? (contentJson.experience as Record<string, any>)
      : {};
  const existing = experience.simulation as { simulator?: string } | undefined;

  if (existing?.simulator && existing.simulator !== FORKLIFT_SIMULATOR_KEY && !FORCE) {
    console.log(
      `\nLesson ${LESSON_SLUG} already carries a different simulation ` +
        `(${existing.simulator}). Refusing to overwrite without --force.`,
    );
    return;
  }

  const merged = {
    ...contentJson,
    experience: { ...experience, simulation: FORKLIFT_INSPECTION_LOAD_SIMULATION },
  };

  console.log(`\n  course      : ${course.title} (${course.id})`);
  console.log(`  lesson      : ${lesson.title} (${lesson.slug})`);
  console.log(
    `  current sim : ${existing ? (existing.simulator ?? 'present, no simulator key') : 'none'}`,
  );

  if (!APPLY) {
    console.log('\nDRY RUN — no write performed. Re-run with --apply to attach the simulation.');
    return;
  }

  const { error: updateError } = await supabase
    .from('course_lessons')
    .update({ content_json: merged })
    .eq('id', lesson.id);
  if (updateError) throw updateError;
  console.log('\nAPPLIED — simulation attached to the lesson.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
