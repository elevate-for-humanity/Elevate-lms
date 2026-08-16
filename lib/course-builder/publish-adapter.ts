/**
 * Compatibility adapters for historical Course Builder payloads.
 *
 * The canonical generation/persistence authority is lib/course-factory.
 * These adapters preserve existing Course Builder contracts while translating
 * them into the canonical CredentialBlueprint shape.
 */

import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import type { BuilderLesson, CourseTemplate, ProgramBuilderTemplate } from './schema';

/** @deprecated Historical adapter retained for callers that still expect the old template shape. */
export function adaptProgramTemplateForPublish(template: ProgramBuilderTemplate) {
  return {
    ...template,
    programSlug: template.slug,
    courseSlug: template.slug,
    modules: template.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        content: {
          ...lesson.content,
          compliance: {
            domainKey: lesson.domainKey ?? null,
            hourCategory: lesson.hourCategory ?? null,
            evidenceType: lesson.evidenceType ?? null,
            deliveryMethod: lesson.deliveryMethod ?? null,
            requiresInstructorSignoff: lesson.requiresInstructorSignoff ?? false,
            instructorRequirement: lesson.instructorRequirement ?? null,
            minimumSeatTimeMinutes: lesson.minimumSeatTimeMinutes ?? null,
            fieldworkEligible: lesson.fieldworkEligible ?? false,
            requiredArtifacts: lesson.requiredArtifacts ?? [],
          },
        },
      })),
    })),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function canonicalLessonSlug(lesson: BuilderLesson): string {
  const base = slugify(lesson.slug || lesson.title);
  const suffix =
    lesson.lessonType === 'checkpoint' ? 'checkpoint' :
    lesson.lessonType === 'quiz' ? 'quiz' :
    lesson.lessonType === 'exam' ? 'exam' :
    lesson.lessonType === 'lab' || lesson.lessonType === 'practical' ? 'lab' :
    lesson.lessonType === 'assignment' ? 'assignment' : null;

  if (!suffix || base.includes(suffix)) return base;
  return `${base}-${suffix}`;
}

function toCorrectAnswer(question: NonNullable<BuilderLesson['quizQuestions']>[number]): number {
  if (typeof question.correctAnswer === 'number') return question.correctAnswer;
  if (Array.isArray(question.correctAnswer)) {
    const first = question.correctAnswer[0];
    const index = question.options?.findIndex((option) => option === first) ?? -1;
    return index >= 0 ? index : 0;
  }
  const index = question.options?.findIndex((option) => option === question.correctAnswer) ?? -1;
  if (index >= 0) return index;
  if (question.type === 'true_false') {
    return String(question.correctAnswer).toLowerCase() === 'true' ? 0 : 1;
  }
  return 0;
}

/**
 * Translate the Admin Program Builder payload into the canonical Course Factory
 * blueprint contract without dropping compliance or assessment metadata.
 */
export function adaptProgramTemplateToBlueprint(template: ProgramBuilderTemplate): CredentialBlueprint {
  const modules = template.modules.map((module) => {
    const lessons = module.lessons.map((lesson, lessonIndex) => {
      const compliance = {
        domainKey: lesson.domainKey ?? null,
        hourCategory: lesson.hourCategory ?? null,
        evidenceType: lesson.evidenceType ?? null,
        deliveryMethod: lesson.deliveryMethod ?? null,
        requiresInstructorSignoff: lesson.requiresInstructorSignoff ?? false,
        instructorRequirement: lesson.instructorRequirement ?? null,
        minimumSeatTimeMinutes: lesson.minimumSeatTimeMinutes ?? null,
        fieldworkEligible: lesson.fieldworkEligible ?? false,
        requiredArtifacts: lesson.requiredArtifacts ?? [],
        unlockRule: lesson.unlockRule ?? null,
        activities: lesson.activities ?? [],
      };

      const content = JSON.stringify({
        ...lesson.content,
        compliance,
        renderedHtml: lesson.renderedHtml ?? null,
      });

      return {
        slug: canonicalLessonSlug(lesson),
        title: lesson.title,
        order: lesson.orderIndex || lessonIndex + 1,
        domainKey: lesson.domainKey ?? module.domainKey,
        objective: lesson.learningObjectives?.[0] ?? `Complete ${lesson.title}`,
        learningObjectives: lesson.learningObjectives ?? [],
        content,
        durationMinutes: lesson.durationMinutes,
        videoFile: lesson.videoUrl ?? undefined,
        instructorNotes: lesson.instructorNotes ?? undefined,
        competencyChecks: (lesson.competencyChecks ?? []).map((check) => ({
          key: check.key,
          label: check.label,
          isCritical: check.isCritical,
          requiresInstructorSignoff: check.requiresInstructorSignoff,
          domainKey: check.domainKey,
          assessmentMethod: check.assessmentMethod,
          evidenceType: check.evidenceType,
        })),
        passingScore: lesson.passingScore ?? undefined,
        quizQuestions: (lesson.quizQuestions ?? []).map((question, questionIndex) => ({
          id: question.id ?? `${canonicalLessonSlug(lesson)}-q${questionIndex + 1}`,
          question: question.prompt,
          options: question.options ?? (question.type === 'true_false' ? ['True', 'False'] : []),
          correctAnswer: toCorrectAnswer(question),
          explanation: question.explanation,
          type: question.type,
          points: question.points,
          domainKey: question.domainKey,
          competencyKeys: question.competencyKeys,
        })),
        lessonType: lesson.lessonType,
        practicalRequired: lesson.practicalRequired ?? false,
        requiredArtifacts: lesson.requiredArtifacts ?? [],
        unlockRule: lesson.unlockRule ?? null,
        activities: lesson.activities ?? [],
        hourCategory: lesson.hourCategory ?? null,
        evidenceType: lesson.evidenceType ?? null,
        deliveryMethod: lesson.deliveryMethod ?? null,
        requiresInstructorSignoff: lesson.requiresInstructorSignoff ?? false,
        instructorRequirement: lesson.instructorRequirement ?? null,
        minimumSeatTimeMinutes: lesson.minimumSeatTimeMinutes ?? null,
        fieldworkEligible: lesson.fieldworkEligible ?? false,
      };
    });

    const requiredLessonTypes = Object.entries(
      lessons.reduce<Record<string, number>>((counts, lesson) => {
        const lessonType = String(lesson.lessonType || 'lesson');
        counts[lessonType] = (counts[lessonType] ?? 0) + 1;
        return counts;
      }, {}),
    ).map(([lessonType, requiredCount]) => ({ lessonType, requiredCount }));

    return {
      slug: slugify(module.slug || module.title),
      title: module.title,
      orderIndex: module.orderIndex,
      domainKey: module.domainKey,
      targetHours: module.targetHours,
      minLessons: lessons.length,
      maxLessons: lessons.length,
      quizRequired: module.quizRequired,
      practicalRequired: module.practicalRequired,
      isCritical: true,
      requiredLessonTypes,
      competencies: [],
      lessons,
      minimumPassingRate: module.minimumPassingRate ?? null,
      supervisedHoursRequired: module.supervisedHoursRequired ?? null,
      fieldworkHoursRequired: module.fieldworkHoursRequired ?? null,
    };
  });

  const expectedLessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  const modulePassingThreshold = Math.max(
    0,
    Math.min(1, (template.modules.find((module) => module.minimumPassingRate != null)?.minimumPassingRate ?? 70) / 100),
  );
  const finalPassingThreshold = Math.max(
    0,
    Math.min(1, (template.finalExam?.passingScore ?? 75) / 100),
  );
  const certificateRequirements = {
    includeHours: template.certificateRequirements.includeHours,
    includeCompetencies: template.certificateRequirements.includeCompetencies,
    includeInstructorVerification: template.certificateRequirements.includeInstructorVerification,
    includeCompletionDate: template.certificateRequirements.includeCompletionDate,
    includeVerificationUrl: template.certificateRequirements.includeVerificationUrl,
    requireAllCriticalCompetencies:
      template.certificateRequirements.requireAllCriticalCompetencies,
  };

  return {
    id: template.id ?? `builder-${template.slug}`,
    programSlug: template.slug,
    credentialSlug: slugify(template.credentialTarget || template.title),
    credentialTitle: template.title,
    credentialCode: slugify(template.credentialTarget || template.slug).toUpperCase().slice(0, 24),
    state: template.regulatory?.governingRegion ?? 'federal',
    status: 'draft',
    version: '1.0.0',
    title: template.title,
    expectedModuleCount: modules.length,
    expectedLessonCount,
    modules,
    assessmentRules: [
      {
        assessmentType: 'module',
        scope: 'all',
        minQuestions: 1,
        maxQuestions: 50,
        passingThreshold: modulePassingThreshold,
      },
      {
        assessmentType: 'final',
        scope: 'all',
        minQuestions: template.finalExam?.questionCount ?? 25,
        maxQuestions: template.finalExam?.questionCount ?? 50,
        passingThreshold: finalPassingThreshold,
      },
    ],
    generationRules: {
      allowRemediation: true,
      allowExpansionLessons: false,
      maxTotalLessons: expectedLessonCount,
      requiresFinalExam: template.requiresFinalExam,
      generatorMode: 'fixed',
    },
    finalExam: {
      questionCount: template.finalExam?.questionCount ?? 25,
      passingScore: template.finalExam?.passingScore ?? 75,
      domainDistribution: template.finalExam?.domainDistribution,
    },
    certificateRequirements,
    regulatory: template.regulatory,
    credentialTarget: template.credentialTarget,
    minimumHours: template.minimumHours,
  };
}

/**
 * Legacy compiler/pipeline adapter. The compiler may still enrich a CourseTemplate,
 * but persistence is delegated to Course Factory through this conversion.
 */
export function adaptCourseTemplateToBlueprint(template: CourseTemplate): CredentialBlueprint {
  const programTemplate: ProgramBuilderTemplate = {
    ...template,
    slug: template.programSlug || template.courseSlug,
    modules: template.modules.map((module) => ({
      ...module,
      orderIndex: module.order,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        orderIndex: lesson.order,
        lessonType: lesson.type,
        content: lesson.content ? { html: lesson.content } : {},
        quizQuestions: (lesson.quizQuestions ?? []).map((question) => ({
          id: question.id ?? `${lesson.slug}-question`,
          prompt: question.question,
          type: 'multiple_choice',
          options: question.options,
          correctAnswer: question.options[question.correctAnswer] ?? String(question.correctAnswer),
          explanation: question.explanation,
        })),
      })),
    })),
  };

  const blueprint = adaptProgramTemplateToBlueprint(programTemplate);
  return {
    ...blueprint,
    programSlug: template.programSlug,
    credentialSlug: slugify(template.courseSlug),
  };
}
