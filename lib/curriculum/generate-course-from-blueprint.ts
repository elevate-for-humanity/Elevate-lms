/**
 * generate-course-from-blueprint
 *
 * Canonical bridge between blueprint definitions and the LMS content tables.
 *
 * Write path: courses → course_modules → course_lessons
 * Read path:  lms_lessons view → lesson page → learner
 *
 * Does NOT write to curriculum_lessons, curriculum_quizzes, curriculum_recaps,
 * training_lessons, or training_courses.
 */

import { getBlueprintById, getBlueprintByProgramSlug } from './blueprints';
import {
  buildCanonicalCourseFromBlueprint,
  type BuildMode,
  type BuildCanonicalCourseResult,
} from './builders/buildCanonicalCourseFromBlueprint';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerateCourseArgs = {
  /** courses.id of an existing course to populate, or omit to create/upsert by slug */
  courseId?:     string;
  /** Blueprint ID (e.g. 'bookkeeping-quickbooks-v1') or program slug (e.g. 'bookkeeping') */
  blueprintSlug: string;
  /** programs.id to link the course to */
  programId:     string;
  mode:          'full' | 'missing-only';
};

export type GenerateCourseResult = BuildCanonicalCourseResult;

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateCourseFromBlueprint(
  args: GenerateCourseArgs,
): Promise<GenerateCourseResult> {
  // Resolve blueprint — try by ID first, then by program slug
  const blueprint =
    getBlueprintById(args.blueprintSlug) ??
    getBlueprintByProgramSlug(args.blueprintSlug);

  if (!blueprint) {
    throw new Error(
      `generateCourseFromBlueprint: no blueprint found for '${args.blueprintSlug}'`,
    );
  }

  const buildMode: BuildMode = args.mode === 'full' ? 'replace' : 'missing-only';

  return buildCanonicalCourseFromBlueprint({
    blueprint,
    programId:  args.programId,
    courseSlug: blueprint.programSlug,
    mode:       buildMode,
  });
}
