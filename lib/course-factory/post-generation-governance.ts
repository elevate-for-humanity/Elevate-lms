import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { compileLearningIntelligence, LearningIntelligenceSchema } from './learning-intelligence';
import { deriveLessonDurationMinutes, normalizeLearningObjectives } from './governance-normalization';

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
  assessmentQuestionsSynced: number;
  flashcardsSynced: number;
  progressionRulesSynced: number;
  totalDurationHours: number;
  warnings: string[];
};

/**
 * Normalizes a newly generated canonical course after Course Factory persistence.
 * This does not invent external standards. It uses the module/lesson domains and
 * approved objectives established by the generation/blueprint stage to create
 * explicit traceability, progression, and self-paced study assets.
 */
export async function normalizeGeneratedCourseForGovernance(
  courseId: string,
): Promise<GovernanceNormalizationResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];

  const { data: modules, error: moduleError } = await db
    .from('course_modules')
    .select('id,title,slug,domain_key,target_hours,order_index,course_lessons(id,title,slug,domain_key,learning_objectives,competency_checks,quiz_questions,content,content_json,script,script_text,lesson_type,ai_generated,approved,generation_status,hour_category,delivery_method,practical_required,evidence_type,requires_instructor_signoff,duration_minutes,passing_score,order_index)')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (moduleError) throw moduleError;

  let lessonsNormalized = 0;
  let assessmentQuestionsSynced = 0;
  let flashcardsSynced = 0;
  let progressionRulesSynced = 0;
  let totalDurationMinutes = 0;

  // Rebuild Course Factory flashcards idempotently so lesson experience and spaced review cannot drift.
  const { error: deleteError } = await db
    .from('flashcards')
    .delete()
    .eq('course_id', courseId)
    .eq('source', 'course_factory');
  if (deleteError) warnings.push(`flashcard cleanup: ${deleteError.message}`);

  for (const module of modules ?? []) {
    const moduleDomain = String((module as any).domain_key || (module as any).slug || '').trim();
    const moduleLessons = asArray((module as any).course_lessons).sort(
      (a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0),
    );
    let moduleDurationMinutes = 0;
    let checkpointLessonId: string | null = null;
    let checkpointPassingScore = 80;

    for (const lesson of moduleLessons) {
      const contentJson = asRecord(lesson.content_json);
      const content = asRecord(lesson.content);
      const experience = asRecord(contentJson.experience ?? content.experience);
      const objectives = normalizeLearningObjectives({
        learningObjectives: lesson.learning_objectives,
        content,
        contentJson,
      });
      const domainKey = String(lesson.domain_key || moduleDomain).trim();
      const competencyChecks = asArray(lesson.competency_checks);
      const derivedCompetencies = competencyChecks.length
        ? competencyChecks
        : objectives.slice(0, 3).map((objective, index) => ({
            key: `${domainKey || 'course'}:${lesson.slug || lesson.id}:${index + 1}`,
            label: objective,
            description: 'Course-level competency trace derived from the lesson objective.',
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

      const lessonType = String(lesson.lesson_type || '');
      const isAssessment = ['quiz', 'checkpoint', 'exam', 'final_exam'].includes(lessonType);
      const isPractical = Boolean(lesson.practical_required) || ['practical', 'lab', 'fieldwork', 'observation', 'practicum'].includes(lessonType);
      const governedExperience = experience && Object.keys(experience).length
        ? { ...experience }
        : null;
      if (governedExperience && !LearningIntelligenceSchema.safeParse(governedExperience.intelligence).success) {
        governedExperience.intelligence = compileLearningIntelligence({
          lessonSlug: String(lesson.slug || lesson.id),
          lessonTitle: String(lesson.title || lesson.slug || 'Lesson'),
          domainKey: domainKey || String(moduleDomain || 'course'),
          competencyKeys: derivedCompetencies.map((competency: any) => String(competency.key)).filter(Boolean),
          objectives,
          masteryThreshold: Number(lesson.passing_score ?? governedExperience?.remediation?.passingScore ?? 80),
          assessment: isAssessment,
          practical: isPractical,
        });
      }
      const duration = deriveLessonDurationMinutes({
        durationMinutes: lesson.duration_minutes,
        lessonType,
        script: lesson.script,
        scriptText: lesson.script_text,
        experienceNarration: experience.narrationScript,
      });
      moduleDurationMinutes += duration;
      totalDurationMinutes += duration;

      if (['checkpoint', 'quiz'].includes(lessonType)) {
        checkpointLessonId = lesson.id;
        checkpointPassingScore = Number(lesson.passing_score ?? experience?.remediation?.passingScore ?? 80);
      }

      const update: Record<string, unknown> = {
        domain_key: domainKey || null,
        competency_checks: derivedCompetencies,
        quiz_questions: questions,
        learning_objectives: objectives,
        duration_minutes: duration,
        hour_category: lesson.hour_category || (isPractical ? 'practical' : isAssessment ? 'exam' : 'didactic'),
        delivery_method: lesson.delivery_method || 'online_async',
        // Generation has completed successfully, but human approval remains separate.
        generation_status: 'generated',
      };
      if (governedExperience) {
        update.content_json = { ...contentJson, experience: governedExperience };
      }

      if (isPractical) {
        // The system may create the requirement, but it may not impersonate a human approval.
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

      if (isAssessment) {
        const { error: removeQuestionsError } = await db
          .from('assessment_questions')
          .delete()
          .eq('lesson_id', lesson.id);
        if (removeQuestionsError) {
          warnings.push(`${lesson.slug || lesson.id} assessment cleanup: ${removeQuestionsError.message}`);
        } else if (questions.length) {
          const assessmentRows = questions.map((question: any, index: number) => ({
            lesson_id: lesson.id,
            question_type: 'multiple_choice',
            prompt: String(question.question ?? question.prompt ?? '').trim(),
            choices: asArray(question.options),
            correct_answer: question.correctAnswer ?? question.correct ?? null,
            explanation: String(question.explanation ?? '').trim() || null,
            competency_key: asArray(question.competencyKeys)[0] ?? null,
            difficulty: String(question.difficulty ?? 'medium'),
            domain_key: String(question.domainKey ?? domainKey ?? '').trim() || null,
            sort_order: index,
          })).filter((row: any) => row.prompt);
          if (assessmentRows.length) {
            const { error: assessmentError } = await db.from('assessment_questions').insert(assessmentRows);
            if (assessmentError) warnings.push(`${lesson.slug || lesson.id} assessment bank: ${assessmentError.message}`);
            else assessmentQuestionsSynced += assessmentRows.length;
          }
        }
      }

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

    const targetHours = Math.round((moduleDurationMinutes / 60) * 100) / 100;
    if (targetHours > 0) {
      const { error: hoursError } = await db
        .from('course_modules')
        .update({ target_hours: targetHours })
        .eq('id', (module as any).id);
      if (hoursError) warnings.push(`${(module as any).slug} target hours: ${hoursError.message}`);
    }

    const { error: ruleError } = await db.from('module_completion_rules').upsert(
      {
        course_id: courseId,
        module_id: (module as any).id,
        required_previous_module_id:
          (modules ?? []).find((candidate: any) => Number(candidate.order_index) === Number((module as any).order_index) - 1)?.id ?? null,
        required_checkpoint_lesson_id: checkpointLessonId,
        minimum_score: checkpointLessonId ? Math.max(1, Math.min(100, Math.round(checkpointPassingScore))) : null,
      },
      { onConflict: 'course_id,module_id' },
    );
    if (ruleError) warnings.push(`${(module as any).slug} progression rule: ${ruleError.message}`);
    else progressionRulesSynced += 1;
  }

  const totalDurationHours = Math.round((totalDurationMinutes / 60) * 100) / 100;
  const { data: course } = await db.from('courses').select('program_id').eq('id', courseId).maybeSingle();
  let declaredProgramHours = 0;
  if (course?.program_id) {
    const { data: program } = await db
      .from('programs')
      .select('total_hours,is_apprenticeship')
      .eq('id', course.program_id)
      .maybeSingle();
    if (program?.is_apprenticeship) declaredProgramHours = Math.max(0, Number(program.total_hours ?? 0));
  }

  const { error: courseUpdateError } = await db
    .from('courses')
    .update({
      generation_status: 'completed',
      generation_progress: 100,
      // Apprenticeship program hours include OJL and must not be replaced by
      // the much smaller self-paced lesson seat-time rollup.
      duration_hours: declaredProgramHours || (totalDurationHours > 0 ? totalDurationHours : null),
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);
  if (courseUpdateError) warnings.push(`course generation state: ${courseUpdateError.message}`);

  return {
    lessonsNormalized,
    assessmentQuestionsSynced,
    flashcardsSynced,
    progressionRulesSynced,
    totalDurationHours,
    warnings,
  };
}
