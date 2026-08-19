import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

function asRecord(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, any>;
    } catch {
      return {};
    }
  }
  return {};
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export type GovernanceNormalizationResult = {
  lessonsNormalized: number;
  flashcardsSynced: number;
  warnings: string[];
};

/**
 * Normalizes a newly generated canonical course after Course Factory persistence.
 * This does not invent external standards. It uses the module/lesson domain already
 * established by the blueprint and creates explicit traceability metadata from it.
 */
export async function normalizeGeneratedCourseForGovernance(
  courseId: string,
): Promise<GovernanceNormalizationResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];

  const { data: modules, error: moduleError } = await db
    .from('course_modules')
    .select('id,title,slug,domain_key,target_hours,course_lessons(id,title,slug,domain_key,learning_objectives,competency_checks,quiz_questions,content,content_json,lesson_type,ai_generated,approved,generation_status,hour_category,delivery_method,practical_required,evidence_type,requires_instructor_signoff,duration_minutes)')
    .eq('course_id', courseId);
  if (moduleError) throw moduleError;

  let lessonsNormalized = 0;
  let flashcardsSynced = 0;

  // Rebuild Course Factory flashcards idempotently so lesson experience and spaced review cannot drift.
  const { error: deleteError } = await db
    .from('flashcards')
    .delete()
    .eq('course_id', courseId)
    .eq('source', 'course_factory');
  if (deleteError) warnings.push(`flashcard cleanup: ${deleteError.message}`);

  for (const module of modules ?? []) {
    const moduleDomain = String((module as any).domain_key || (module as any).slug || '').trim();
    for (const lesson of asArray((module as any).course_lessons)) {
      const contentJson = asRecord(lesson.content_json);
      const content = asRecord(lesson.content);
      const experience = asRecord(contentJson.experience ?? content.experience);
      const objectives = asArray(lesson.learning_objectives).map((v) => String(v).trim()).filter(Boolean);
      const domainKey = String(lesson.domain_key || moduleDomain).trim();
      const competencyChecks = asArray(lesson.competency_checks);
      const derivedCompetencies = competencyChecks.length
        ? competencyChecks
        : objectives.slice(0, 3).map((objective, index) => ({
            key: `${domainKey || 'course'}:${lesson.slug || lesson.id}:${index + 1}`,
            label: objective,
            description: 'Course-level competency trace derived from the approved lesson objective.',
            isCritical: false,
            requiresInstructorSignoff: Boolean(lesson.practical_required),
            domainKey: domainKey || null,
          }));

      const questions = asArray(lesson.quiz_questions).map((question: any) => ({
        ...question,
        domainKey: question?.domainKey || domainKey || undefined,
        competencyKeys:
          asArray(question?.competencyKeys).length > 0
            ? question.competencyKeys
            : derivedCompetencies.slice(0, 3).map((c: any) => c.key),
      }));

      const isAssessment = ['quiz', 'checkpoint', 'exam'].includes(String(lesson.lesson_type || ''));
      const isPractical = Boolean(lesson.practical_required) || ['practical', 'lab', 'fieldwork', 'observation'].includes(String(lesson.lesson_type || ''));
      const update: Record<string, unknown> = {
        domain_key: domainKey || null,
        competency_checks: derivedCompetencies,
        quiz_questions: questions,
        hour_category: lesson.hour_category || (isPractical ? 'practical' : isAssessment ? 'exam' : 'didactic'),
        delivery_method: lesson.delivery_method || 'online_async',
      };

      if (isPractical) {
        // The system may generate the requirement, but it may not impersonate a human approval.
        update.evidence_type = lesson.evidence_type || 'observation';
        update.requires_instructor_signoff = true;
      }

      if (lesson.ai_generated === true && lesson.approved !== true) {
        // Preserve human-review requirement. Never auto-approve AI content.
        update.approved = false;
      }

      const { error: updateError } = await db.from('course_lessons').update(update).eq('id', lesson.id);
      if (updateError) warnings.push(`${lesson.slug || lesson.id}: ${updateError.message}`);
      else lessonsNormalized += 1;

      const flashcards = asArray(experience.flashcards);
      if (flashcards.length) {
        const rows = flashcards
          .map((card: any) => ({
            course_id: courseId,
            lesson_id: lesson.id,
            front: String(card?.front ?? '').trim(),
            back: String(card?.back ?? '').trim(),
            hint: asArray(card?.tags).map(String).join(', ') || null,
            difficulty: 1,
            source: 'course_factory',
          }))
          .filter((card: any) => card.front && card.back);
        if (rows.length) {
          const { error: flashcardError } = await db.from('flashcards').insert(rows);
          if (flashcardError) warnings.push(`${lesson.slug || lesson.id} flashcards: ${flashcardError.message}`);
          else flashcardsSynced += rows.length;
        }
      }
    }
  }

  return { lessonsNormalized, flashcardsSynced, warnings };
}
