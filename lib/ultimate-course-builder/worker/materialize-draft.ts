import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateCredentialProfile } from '../core/types';
import { validateLessonBlueprint } from '../instructional/lesson-blueprint';
import { UltimatePlatformInstructionalGenerator } from '../adapters/platform-instructional-generator';

const slug = (key: string) => key.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '').slice(0, 120) || 'lesson';

/** Media recommendation needs canonical lesson rows before publication.
 * Parallel plans reserve unpublished, source-bound structural drafts; their
 * instruction jobs still own generated instruction and acceptance. No empty
 * credential row or model-generated acceptance is manufactured by reservation. */
export async function materializeUltimateDraft(db: SupabaseClient, courseId: string,
  profile: UltimateCredentialProfile, competencyIds?: string[],
  options: {deferInstruction?: boolean} = {}): Promise<UltimateCredentialProfile> {
  const { data: lessons, error } = await db.from('course_lessons')
    .select('id,slug').eq('course_id', courseId);
  if (error) throw error;
  const canonicalLessonIds: Record<string, string> = { ...(profile.canonicalLessonIds ?? {}) };
  const instructional = new UltimatePlatformInstructionalGenerator();
  let moduleId: string | undefined;
  for (const [index, competency] of profile.competencies.entries()) {
    if (competencyIds && !competencyIds.includes(competency.id)) continue;
    const lessonSlug = slug(competency.id);
    const existing = (lessons ?? []).find(l => l.id === competency.id || l.slug === lessonSlug);
    if (existing) { canonicalLessonIds[competency.id] = existing.id; continue; }
    // The credential-row trigger requires a real source-bound 13-stage draft.
    // The coordinator does not call Google or claim a reviewed/finished lesson.
    const blueprint = options.deferInstruction
      ? await instructional.sourceDraft({ profile, competency })
      : await instructional.blueprint({ profile, competency });
    validateLessonBlueprint(blueprint, competency);
    if (!moduleId) {
      const { data: modules, error: modulesError } = await db.from('course_modules')
        .select('order_index').eq('course_id', courseId);
      if (modulesError) throw modulesError;
      const { data: module, error: moduleError } = await db.from('course_modules')
        .upsert({ course_id: courseId, slug: 'ultimate-core', title: profile.title,
          order_index: Math.max(0, ...(modules ?? []).map(m => m.order_index ?? 0)) + 1,
          is_required: true, is_published: false, is_draft: true },
        { onConflict: 'course_id,slug', ignoreDuplicates: true }).select('id').maybeSingle();
      if (moduleError) throw moduleError;
      if (module) moduleId = module.id;
      else {
        const { data: found, error: lookupError } = await db.from('course_modules')
          .select('id').eq('course_id', courseId).eq('slug', 'ultimate-core').single();
        if (lookupError) throw lookupError;
        moduleId = found.id;
      }
    }
    const { data: lesson, error: lessonError } = await db.from('course_lessons')
      .upsert({ id: canonicalLessonIds[competency.id], course_id: courseId, module_id: moduleId, slug: lessonSlug,
        title: competency.title, order_index: index + 1, lesson_type: 'lesson',
        status: 'draft', is_published: false, approved: false, is_required: true,
        generation_status: 'generating', practical_required: competency.requiresPracticalEvidence,
        learning_objectives: blueprint?.objectives.map(o => o.text) ?? [],
        content: blueprint?.segments.map(s => s.text).join('\n\n') ?? '',
        content_json: { ultimateDraft: true, competencyId: competency.id,
          sourceRequirementIds: competency.authorityRequirementIds,
          ...(options.deferInstruction ? {instructionPending: true, sourceBlueprintOnly: true} : {}),
          blueprint, releasePending: true } },
      { onConflict: 'course_id,slug', ignoreDuplicates: true }).select('id').maybeSingle();
    if (lessonError) throw lessonError;
    if (lesson) canonicalLessonIds[competency.id] = lesson.id;
    else {
      const { data: found, error: lookupError } = await db.from('course_lessons')
        .select('id').eq('course_id', courseId).eq('slug', lessonSlug).single();
      if (lookupError) throw lookupError;
      canonicalLessonIds[competency.id] = found.id;
    }
  }
  return { ...profile, canonicalLessonIds };
}
