import { UltimateBuildRunner, type UltimateRunContext } from './build-runner';
import type { UltimateCredentialProfile } from './types';

export type UltimateCoursePlan = {
  courseId: string;
  profile: UltimateCredentialProfile;
};

export async function runUltimateCourse(
  plan: UltimateCoursePlan,
  makeRunner: (competencyId: string) => UltimateBuildRunner,
) {
  const lessons = [];
  for (const competency of plan.profile.competencies) {
    const context: UltimateRunContext = {
      buildId: plan.courseId + ':' + competency.id,
      courseId: plan.courseId,
      profile: plan.profile,
      artifacts: {},
      findings: [],
    };
    lessons.push({
      competencyId: competency.id,
      result: await makeRunner(competency.id).run(context),
    });
  }
  return {
    courseId: plan.courseId,
    lessons,
    completed: lessons.length === plan.profile.competencies.length,
  };
}
