/**
 * lib/curriculum/builders/buildCourseFromBlueprint.ts
 *
 * Assembles a PRS (or any blueprint-governed) course from the DB.
 *
 * Rules:
 * - Slugs are the identity. Titles are display text.
 * - Blueprint order is authoritative. DB query order is ignored.
 * - Fails closed: any missing slug, count mismatch, or DB error throws.
 * - Never infers structure from DB rows.
 */

import type { CredentialBlueprint } from '../blueprints/types';
import { validateBlueprint } from '../blueprints/validateBlueprint';
import { createClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DbLesson = {
  id: string;
  slug: string;
  title: string;
  program_id: string;
  domain_key: string | null;
  competency_keys: string[] | null;
  summary_text: string | null;
  reflection_prompt: string | null;
  cognitive_level: string | null;
};

export type BuiltBlueprintLesson = {
  moduleKey: string;
  moduleTitle: string;
  moduleOrder: number;
  lessonOrder: number;
  lessonSlug: string;
  lessonTitle: string;
  domainKey: string;
  dbLesson: DbLesson;
};

export type BuiltBlueprintCourse = {
  blueprintId: string;
  credentialSlug: string;
  state: string;
  moduleCount: number;
  lessonCount: number;
  lessons: BuiltBlueprintLesson[];
};

type BuildArgs = {
  blueprint: CredentialBlueprint;
  supabase: ReturnType<typeof createClient>;
  programId: string;
};

// ── Builder ───────────────────────────────────────────────────────────────────

export async function buildCourseFromBlueprint({
  blueprint,
  supabase,
  programId,
}: BuildArgs): Promise<BuiltBlueprintCourse> {
  // 1. Validate blueprint structure before touching DB
  validateBlueprint(blueprint);

  // 2. Collect all required slugs from blueprint
  const requiredSlugs = blueprint.modules.flatMap(m => m.lessons.map(l => l.slug));

  // 3. Load lessons from DB by slug — slug is identity, not title
  const { data: dbLessons, error } = await supabase
    .from('curriculum_lessons')
    .select('id, slug, title, program_id, domain_key, competency_keys, summary_text, reflection_prompt, cognitive_level')
    .eq('program_id', programId)
    .in('slug', requiredSlugs);

  if (error) {
    throw new Error(`buildCourseFromBlueprint: DB query failed — ${error.message}`);
  }

  const lessons: DbLesson[] = dbLessons ?? [];

  // 4. Fail if any required slug is missing
  const lessonMap = new Map<string, DbLesson>(lessons.map(l => [l.slug, l]));
  const missingSlugs = requiredSlugs.filter(s => !lessonMap.has(s));

  if (missingSlugs.length > 0) {
    throw new Error(
      `buildCourseFromBlueprint: ${missingSlugs.length} required lesson(s) missing from DB:\n` +
      missingSlugs.map(s => `  - ${s}`).join('\n')
    );
  }

  // 5. Fail if DB returned unexpected count (duplicate slugs, wrong program_id, etc.)
  if (lessons.length !== blueprint.expectedLessonCount) {
    throw new Error(
      `buildCourseFromBlueprint: expected ${blueprint.expectedLessonCount} DB lessons, got ${lessons.length}`
    );
  }

  // 6. Assemble in blueprint order — never DB order
  const resolved: BuiltBlueprintLesson[] = blueprint.modules.flatMap(mod =>
    mod.lessons.map(lessonRef => {
      const dbLesson = lessonMap.get(lessonRef.slug)!;
      return {
        moduleKey:   mod.key,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
        lessonOrder: lessonRef.order,
        lessonSlug:  lessonRef.slug,
        lessonTitle: lessonRef.title,
        domainKey:   lessonRef.domainKey,
        dbLesson,
      };
    })
  );

  // 7. Final count guard
  if (resolved.length !== blueprint.expectedLessonCount) {
    throw new Error(
      `buildCourseFromBlueprint: resolved ${resolved.length} lessons but expected ${blueprint.expectedLessonCount}`
    );
  }

  return {
    blueprintId:    blueprint.id,
    credentialSlug: blueprint.credentialSlug,
    state:          blueprint.state,
    moduleCount:    blueprint.expectedModuleCount,
    lessonCount:    resolved.length,
    lessons:        resolved,
  };
}
