import { assertCompleteLesson } from './lesson-contract';
import { UltimateBuildRunner, type UltimateRunContext } from './build-runner';
import {
  ULTIMATE_BUILD_STEPS,
  type UltimateCredentialProfile,
  type UltimateBuildStep,
} from './types';
import type { UltimatePersistencePort } from './ports';
import type { UltimateArtifactPort } from '../artifacts/types';
export type UltimateCoursePlan = {
  buildId: string;
  courseId: string;
  profile: UltimateCredentialProfile;
  targetLessonBuildId?: string;
  targetCompetencyId?: string;
  startIndex?: number;
  maxLessons?: number;
  repairFromStep?: UltimateBuildStep;
  repairRenderRevision?: string;
  beforeCheckpoint?: UltimateRunContext['beforeCheckpoint'];
};
export async function runUltimateCourse(
  plan: UltimateCoursePlan,
  makeRunner: (competencyId: string) => UltimateBuildRunner,
  persistence: UltimatePersistencePort,
  artifactStore?: UltimateArtifactPort,
  assertActive?: () => void,
) {
  console.info('[UltimateCourse] build started', {buildId: plan.buildId, startIndex: plan.startIndex, maxLessons: plan.maxLessons});
  assertActive?.();
  await persistence.updateBuild({
    buildId: plan.buildId,
    status: 'running',
    currentStep: 'standards_lock',
  });
  const lessons = [];
  const eligible = plan.targetCompetencyId
    ? plan.profile.competencies.filter((c) => c.id === plan.targetCompetencyId)
    : plan.profile.competencies;
  const startIndex = plan.targetCompetencyId ? 0 : Math.max(0, plan.startIndex ?? 0);
  const competencies = eligible.slice(startIndex, plan.maxLessons ? startIndex + plan.maxLessons : undefined);
  if (plan.targetCompetencyId && !competencies.length)
    throw new Error('ULTIMATE_TARGET_COMPETENCY_NOT_FOUND');
  for (const competency of competencies) {
    assertActive?.();
    console.info('[UltimateCourse] competency started', {buildId: plan.buildId, competencyId: competency.id});
    const lesson = plan.targetLessonBuildId
      ? { id: plan.targetLessonBuildId }
      : await persistence.createLesson({
          buildId: plan.buildId,
          lessonKey: competency.id,
          competencyId: competency.id,
        });
    console.info('[UltimateCourse] checkpoint loading', {lessonBuildId: lesson.id, competencyId: competency.id});
    const checkpoint = await persistence.loadLessonCheckpoint({ lessonBuildId: lesson.id });
    console.info('[UltimateCourse] checkpoint loaded', {lessonBuildId: lesson.id, passedSteps: checkpoint.passedSteps.length});
    const restoredPassed: UltimateBuildStep[] = [];
    for (const step of ULTIMATE_BUILD_STEPS) {
      if (step === plan.repairFromStep) break;
      if (!checkpoint.passedSteps.includes(step)) break;
      restoredPassed.push(step);
    }
    const restoredArtifacts: any = Object.fromEntries(
      restoredPassed.map((step) => [step, checkpoint.artifacts[step]]),
    );
    if(!plan.repairFromStep && (checkpoint.artifacts as any).__repairState)restoredArtifacts.__repairState=(checkpoint.artifacts as any).__repairState;
    if((checkpoint.artifacts as any).__renderRevision)restoredArtifacts.__renderRevision=(checkpoint.artifacts as any).__renderRevision;
    if(plan.repairRenderRevision)restoredArtifacts.__renderRevision=plan.repairRenderRevision;
    const context: UltimateRunContext = {
      buildId: plan.buildId + ':' + competency.id,
      courseId: plan.courseId,
      profile: plan.profile,
      lessonBuildId: lesson.id,
      artifacts: restoredArtifacts as UltimateRunContext['artifacts'],
      // Previous failed findings are historical. A passed checkpoint must not
      // carry its old error into a newly repaired lesson's acceptance result.
      findings: checkpoint.findings.filter((f) => f.severity !== 'error' && restoredPassed.includes(f.step)),
      passedSteps: new Set(restoredPassed),
      assertActive,
      beforeCheckpoint: plan.beforeCheckpoint,
      persistStep: async (input) => {
        assertActive?.();
        console.info('[UltimateCourse] step transition', {lessonBuildId: lesson.id, step: input.step, state: input.state});
        await persistence.updateBuild({
          buildId: plan.buildId,
          status: 'running',
          currentStep: input.step,
        });
        await persistence.recordStep({ lessonBuildId: lesson.id, ...input });
      },
      persistFinding: async (finding) => {
        assertActive?.();
        return persistence.recordFinding({ buildId: plan.buildId, finding });
      },
      persistArtifact: artifactStore
        ? async ({ step, artifacts }) => {
            assertActive?.();
            await persistence.saveArtifact({
              lessonBuildId: lesson.id,
              artifacts: context.artifacts,
            });
            await artifactStore.createVersion({
              buildId: plan.buildId,
              lessonBuildId: lesson.id,
              stage: step,
              artifactType: 'stage_output',
              logicalKey: `lesson:${lesson.id}:stage:${step}`,
              content: artifacts,
              provenance: { courseId: plan.courseId, competencyId: competency.id },
              generatedBy: 'ultimate-worker',
            });
          }
        : undefined,
    };
    console.info('[UltimateCourse] runner started', {lessonBuildId: lesson.id});
    const result = await makeRunner(competency.id).run(context);
    console.info('[UltimateCourse] runner returned', {lessonBuildId: lesson.id, findings: result.findings.length});
    assertActive?.();
    if (!result.findings.some((f) => f.severity === 'error')) {
      try { assertCompleteLesson(result.artifacts, plan.profile, competency.id); }
      catch (error) {
        result.findings.push({step:'credential_release',severity:'error',code:'FULL_LESSON_ACCEPTANCE_REQUIRED',message:error instanceof Error?error.message:String(error)});
      }
    }
    await persistence.finishLesson({
      lessonBuildId: lesson.id,
      status: result.findings.some((f) => f.severity === 'error') ? 'built_with_findings' : 'built',
      artifacts: result.artifacts,
      findings: result.findings,
    });
    lessons.push({ competencyId: competency.id, lessonBuildId: lesson.id, result });
    if (result.findings.some((f) => f.severity === 'error')) break;
  }
  const findings = lessons.flatMap((x) => x.result.findings);
  const hasErrors = findings.some((f) => f.severity === 'error');
  const completed = !hasErrors && lessons.length === competencies.length;
  assertActive?.();
  await persistence.updateBuild({
    buildId: plan.buildId,
    // Repairable quality findings remain in the automatic production lifecycle.
    // Only the worker's durable external prerequisites may terminate a run.
    status: hasErrors || plan.targetCompetencyId || competencies.length !== plan.profile.competencies.length ? 'running' : 'built',
    currentStep: hasErrors ? ('selective_repair' as UltimateBuildStep) : ('credential_release' as UltimateBuildStep),
    findings,
  });
  return { buildId: plan.buildId, courseId: plan.courseId, lessons, findings, completed,
    nextIndex: startIndex + lessons.length, hasRemaining: startIndex + lessons.length < eligible.length };
}
