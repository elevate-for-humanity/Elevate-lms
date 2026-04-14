/**
 * lib/course-builder/publish-adapter.ts
 * Adapts ProgramBuilderTemplate to the shape runCoursePublishPipeline expects.
 */

import type { ProgramBuilderTemplate } from './schema';

export function adaptProgramTemplateForPublish(template: ProgramBuilderTemplate) {
  return {
    ...template,
    // pipeline expects programSlug / courseSlug at top level
    programSlug: template.slug,
    courseSlug:  template.slug,
    modules: template.modules.map(module => ({
      ...module,
      lessons: module.lessons.map(lesson => ({
        ...lesson,
        // merge compliance fields into content so pipeline persists them
        content: {
          ...lesson.content,
          compliance: {
            domainKey:                  lesson.domainKey ?? null,
            hourCategory:               lesson.hourCategory ?? null,
            evidenceType:               lesson.evidenceType ?? null,
            deliveryMethod:             lesson.deliveryMethod ?? null,
            requiresInstructorSignoff:  lesson.requiresInstructorSignoff ?? false,
            instructorRequirement:      lesson.instructorRequirement ?? null,
            minimumSeatTimeMinutes:     lesson.minimumSeatTimeMinutes ?? null,
            fieldworkEligible:          lesson.fieldworkEligible ?? false,
            requiredArtifacts:          lesson.requiredArtifacts ?? [],
          },
        },
      })),
    })),
  };
}
