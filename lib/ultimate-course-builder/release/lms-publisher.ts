import {assertCompleteLesson} from '../core/lesson-contract';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {UltimateLmsCoursePackage} from './lms-package';
import {validateLmsCoursePackage} from './lms-package';

/** @deprecated Publication requires the build, actor and optional worker fence
 * accepted by UltimateReleaseService. A bare LMS package has no release identity. */
export class UltimateLmsPublisher {
  constructor(_db: SupabaseClient) {}
  async publish(courseId: string, p: UltimateLmsCoursePackage): Promise<never> {
    if (!courseId) throw new Error('ULTIMATE_COURSE_ID_REQUIRED');
    const valid=validateLmsCoursePackage(p);
    if (!valid.pass) throw new Error('ULTIMATE_LMS_PACKAGE_INCOMPLETE:'+valid.missing.join(','));
    for (const lesson of p.lessons) assertCompleteLesson(lesson.contractArtifacts ?? {});
    throw new Error('ULTIMATE_ATOMIC_RELEASE_REQUIRED: use UltimateReleaseService.publish with build and actor context');
  }
}
