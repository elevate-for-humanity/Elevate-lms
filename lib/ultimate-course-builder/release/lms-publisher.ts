import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateLmsCoursePackage } from './lms-package';
import { validateLmsCoursePackage } from './lms-package';

export class UltimateLmsPublisher {
  constructor(private db: SupabaseClient) {}

  async publish(courseId: string, coursePackage: UltimateLmsCoursePackage) {
    const valid = validateLmsCoursePackage(coursePackage);
    if (!valid.pass) {
      throw new Error('ULTIMATE_LMS_PACKAGE_INCOMPLETE:' + valid.missing.join(','));
    }

    for (const lesson of coursePackage.lessons) {
      const { data, error } = await this.db
        .from('course_lessons')
        .update({
          learning_objectives: lesson.objectives,
          video_url: lesson.film.videoUrl,
          content_json: {
            ultimate: true,
            learningObjects: lesson.learningObjects,
            assessment: lesson.assessment,
            remediation: lesson.remediation,
            masteryRules: lesson.masteryRules,
            careerContext: lesson.careerContext,
            traceability: lesson.traceability,
            film: lesson.film,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', lesson.id)
        .eq('course_id', courseId)
        .select('id');

      if (error) throw error;
      if (data?.length !== 1) {
        throw new Error('ULTIMATE_LMS_LESSON_NOT_FOUND');
      }
    }

    const { data: courses, error } = await this.db
      .from('courses')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .select('id');

    if (error) throw error;
    if (courses?.length !== 1) {
      throw new Error('ULTIMATE_LMS_COURSE_NOT_FOUND');
    }

    return { courseId, publishedLessons: coursePackage.lessons.length };
  }
}
