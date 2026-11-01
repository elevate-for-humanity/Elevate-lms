import { assertCourseBuilderGenerationEnabled } from './generation-control';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBlueprintById, getBlueprintByProgramSlug } from '@/lib/curriculum/blueprints';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { resolveCanonicalSlug } from '@/lib/programs/slug';
import { startCanonicalCourse } from './start-course';
import { validateSyllabusPlan, type SyllabusPlan } from '../authoring/syllabus-plan';

export type GenerationRequest = {
  courseId?: string; programId?: string; programSlug?: string;
  title?: string; topic?: string; audience?: string; state?: string;
  blueprint?: CredentialBlueprint; blueprintId?: string; dryRun?: boolean;
  moduleCount?: number; lessonsPerModule?: number; buildScope?: 'lesson' | 'course';
};

export function blueprintSourcePlan(blueprint: CredentialBlueprint): SyllabusPlan {
  return {
    text: JSON.stringify(blueprint),
    modules: blueprint.modules.map(module => ({
      title: module.title,
      lessons: (module.lessons ?? []).map(lesson => ({
        title: lesson.title,
        objectives: lesson.learningObjectives?.length ? lesson.learningObjectives : [lesson.objective || lesson.title],
        content: lesson.content || '',
      })),
    })),
  };
}

/** Resolve existing identity before writing. This never replaces courses or learner records. */
export async function requestCanonicalGeneration(db: SupabaseClient, input: GenerationRequest, actorId: string) {
  await assertCourseBuilderGenerationEnabled(db, input.courseId);
  let slug = resolveCanonicalSlug(input.programSlug || input.blueprint?.programSlug || '');
  const programId = input.programId;
  let programTitle: string | undefined;
  if (programId) {
    const program = await db.from('programs').select('id,slug,title').eq('id', programId).single();
    if (program.error || !program.data) throw program.error ?? new Error('PROGRAM_NOT_FOUND');
    slug = resolveCanonicalSlug(program.data.slug);
    programTitle = program.data.title;
  }
  let blueprint = input.blueprint;
  if (!blueprint && input.blueprintId) {
    blueprint = await getBlueprintById(input.blueprintId) ?? undefined;
    if (!blueprint) throw new Error('BLUEPRINT_NOT_FOUND');
  }
  if (!blueprint && slug && !input.courseId) blueprint = await getBlueprintByProgramSlug(slug) ?? undefined;
  if (blueprint && slug && resolveCanonicalSlug(blueprint.programSlug) !== slug)
    throw new Error('BLUEPRINT_PROGRAM_IDENTITY_MISMATCH');
  const syllabusPlan = blueprint ? blueprintSourcePlan(blueprint) : undefined;
  if (syllabusPlan && !validateSyllabusPlan(syllabusPlan)) throw new Error('SOURCE_BLUEPRINT_INCOMPLETE');
  if (!input.courseId && !slug) throw new Error('COURSE_ID_OR_PROGRAM_REQUIRED');
  let query = db.from('courses').select('id,title,slug,description,program_id,status');
  query = input.courseId ? query.eq('id', input.courseId) : query.eq('slug', slug);
  const existing = await query.maybeSingle();
  if (existing.error) throw existing.error;
  if (input.courseId && !existing.data) throw new Error('COURSE_NOT_FOUND');
  const title = input.title || existing.data?.title || programTitle || blueprint?.title || blueprint?.credentialTitle;
  if (!title?.trim()) throw new Error('COURSE_TITLE_REQUIRED');
  if (input.dryRun) return { ok: true, dryRun: true, courseId: existing.data?.id, courseSlug: slug,
    authority: 'ultimate-course-builder', videosQueued: 0 };
  let course = existing.data;
  if (!course) {
    const created = await db.from('courses').insert({
      slug, title, description: input.topic || '', program_id: programId || null,
      status: 'draft', is_active: true, created_by: actorId,
    }).select('id,title,slug,description,program_id,status').single();
    if (created.error?.code === '23505') {
      const concurrent = await db.from('courses').select('id,title,slug,description,program_id,status').eq('slug', slug).single();
      if (concurrent.error) throw concurrent.error;
      course = concurrent.data;
    } else {
      if (created.error) throw created.error;
      course = created.data;
    }
  }
  if (!course) throw new Error('COURSE_IDENTITY_NOT_PERSISTED');
  const response = await startCanonicalCourse(db, {
    courseId: course.id, programSlug: slug || resolveCanonicalSlug(course.slug), title,
    topic: input.topic, audience: input.audience, state: input.state,
    ...(syllabusPlan ? { syllabusPlan } : {}),
  }, actorId);
  const result = await response.json();
  return { ...result, ok: response.ok && result.ok === true,
    courseId: course.id, courseSlug: course.slug, authority: 'ultimate-course-builder',
    videosQueued: 0, completionState: 'media_pending' as const,
    ...(!response.ok ? { errors: [String(result.error || 'CANONICAL_GENERATION_NOT_STARTED')] } : {}),
  };
}
