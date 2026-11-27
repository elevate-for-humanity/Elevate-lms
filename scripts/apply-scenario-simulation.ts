/**
 * scripts/apply-scenario-simulation.ts
 *
 * Attaches a scenario-engine simulation (lib/lms/scenario-simulation.ts;
 * configs indexed in lib/lms/simulations/index.ts) to one lesson of its
 * course by merging it into the lesson's content_json.experience
 * .simulation — the slot the learner interactions API surfaces as the
 * `${lessonSlug}-simulation` interaction and scores server-side into
 * interaction_progress.
 *
 * DRY-RUN BY DEFAULT. A bare run prints the registered simulations and
 * never opens a database connection. Pass --sim <simId> --course
 * <course-slug> --lesson <lesson-slug> to preview the exact merge against
 * the live lesson row (read-only), and add --apply to write. An existing
 * simulation with a different simulator key or simId is never overwritten
 * unless --force is also passed.
 *
 * Usage:
 *   pnpm tsx scripts/apply-scenario-simulation.ts
 *   pnpm tsx scripts/apply-scenario-simulation.ts --sim welding-weld-booth-lab --course welding-foundations --lesson welding-13
 *   pnpm tsx scripts/apply-scenario-simulation.ts --sim welding-weld-booth-lab --course welding-foundations --lesson welding-13 --apply
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { SCENARIO_SIMULATOR_KEY, scenarioResponseCount } from '../lib/lms/scenario-simulation';
import { SCENARIO_SIMULATIONS, getScenarioSimulation } from '../lib/lms/simulations/index';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');

function argValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

const SIM_ID = argValue('--sim');
const COURSE_SLUG = argValue('--course');
const LESSON_SLUG = argValue('--lesson');

function printPlan() {
  console.log('Scenario simulation — attach plan');
  console.log('  registered simulations:');
  for (const sim of Object.values(SCENARIO_SIMULATIONS)) {
    console.log(
      `    - ${sim.simId}: ${sim.title} (${scenarioResponseCount(sim)} responses)`,
    );
  }
  if (SIM_ID) {
    const sim = getScenarioSimulation(SIM_ID);
    if (sim) {
      console.log(`  selected    : ${sim.simId} — ${sim.title}`);
      console.log(`  writes to   : course_lessons.content_json.experience.simulation`);
      console.log('  syllabus topics evidenced:');
      for (const entry of sim.syllabusTopics) {
        console.log(`    - [${entry.coverage}] ${entry.topic}`);
      }
    }
  }
}

async function main() {
  printPlan();

  if (!SIM_ID || !COURSE_SLUG || !LESSON_SLUG) {
    console.log(
      '\n--sim, --course, and --lesson are all required to preview or attach. Nothing else to do.',
    );
    return;
  }
  const sim = getScenarioSimulation(SIM_ID);
  if (!sim) throw new Error(`Unknown simId ${SIM_ID} (see the registered list above)`);

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
  const existing = experience.simulation as
    | { simulator?: string; simId?: string }
    | undefined;

  const sameSim =
    existing?.simulator === SCENARIO_SIMULATOR_KEY && existing?.simId === sim.simId;
  if (existing && !sameSim && !FORCE) {
    console.log(
      `\nLesson ${LESSON_SLUG} already carries a different simulation ` +
        `(${existing.simulator ?? 'unknown'}${existing.simId ? ` / ${existing.simId}` : ''}). ` +
        'Refusing to overwrite without --force.',
    );
    return;
  }

  const merged = {
    ...contentJson,
    experience: { ...experience, simulation: sim },
  };

  console.log(`\n  course      : ${course.title} (${course.id})`);
  console.log(`  lesson      : ${lesson.title} (${lesson.slug})`);
  console.log(
    `  current sim : ${existing ? `${existing.simulator ?? 'present, no simulator key'}${existing.simId ? ` / ${existing.simId}` : ''}` : 'none'}`,
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
