import { randomUUID } from 'node:crypto';
import {
  practicalReviewPasses,
  requiredPracticalKeys,
  validatePracticalReview,
  validatePracticalSubmission,
} from '@/lib/lms/course-practical-policy';

export const QA_PRACTICAL_NOTICE =
  'QA submission/review workflow verified; no real competency awarded';
export function stagedPracticalKeys(snapshot: any): string[] {
  if (snapshot.qaOnly !== true || snapshot.practicalRequired !== true) return [];
  return requiredPracticalKeys(snapshot.practicalLesson ?? {});
}
export function stagedPracticalComplete(snapshot: any, progress: any): boolean {
  if (!snapshot.practicalRequired) return true;
  const keys = stagedPracticalKeys(snapshot);
  return (
    keys.length > 0 && keys.every((key) => practicalReviewPasses(progress.practical ?? {}, key))
  );
}
export function submitStagedPractical(run: any, input: any, now = new Date().toISOString()) {
  const progress = structuredClone(run.progress ?? {});
  const keys = stagedPracticalKeys(run.snapshot);
  if (!keys.length) throw new Error('PRACTICAL_QA_RUN_REQUIRED');
  if (progress.practical && !['revision_required', 'rejected'].includes(progress.practical.status))
    throw new Error('PRACTICAL_SUBMISSION_STATE_CONFLICT');
  const artifact = (progress.qaPracticalArtifacts ?? []).find(
    (item: any) =>
      item.id === input.evidenceId &&
      item.runId === run.id &&
      item.lessonBuildId === run.lesson_build_id &&
      item.artifactHash === run.artifact_hash &&
      item.syntheticQA === true,
  );
  if (!artifact) throw new Error('PRACTICAL_QA_ARTIFACT_REQUIRED');
  const submission = {
    competencyKeys: keys,
    evidence: [{ type: 'file', value: artifact.path }],
    learnerAttestation: input.learnerAttestation,
  };
  validatePracticalSubmission(keys, submission);
  if (progress.practical)
    progress.practicalHistory = [...(progress.practicalHistory ?? []), progress.practical];
  progress.practical = {
    id: randomUUID(),
    revision: (progress.practical?.revision ?? 0) + 1,
    competency_keys: keys,
    evidence: submission.evidence,
    artifact,
    learner_attestation: true,
    submitted_at: now,
    status: 'submitted',
    synthetic_qa: true,
    notice: QA_PRACTICAL_NOTICE,
    course_practical_reviews: [],
  };
  progress.completed = false;
  return progress;
}
export function reviewStagedPractical(
  run: any,
  input: any,
  reviewerId: string,
  now = new Date().toISOString(),
) {
  const progress = structuredClone(run.progress ?? {}),
    submission = progress.practical;
  if (
    run.snapshot.qaOnly !== true ||
    input.lessonBuildId !== run.lesson_build_id ||
    input.artifactHash !== run.artifact_hash ||
    !submission ||
    input.submissionId !== submission.id ||
    input.revision !== submission.revision
  )
    throw new Error('PRACTICAL_QA_REVIEW_SCOPE_MISMATCH');
  validatePracticalReview(stagedPracticalKeys(run.snapshot), submission, input);
  const artifact = (progress.qaPracticalArtifacts ?? []).find(
    (item: any) =>
      item.id === submission.artifact?.id &&
      item.path === submission.artifact?.path &&
      item.sha256 === submission.artifact?.sha256 &&
      item.runId === run.id,
  );
  if (!artifact?.syntheticQA || !reviewerId) throw new Error('PRACTICAL_QA_ARTIFACT_REQUIRED');
  submission.course_practical_reviews.push({
    id: randomUUID(),
    reviewer_id: reviewerId,
    decision: input.decision,
    competency_results: input.competencyResults,
    comments: input.comments.trim(),
    reviewed_at: now,
    submission_id: submission.id,
    submission_revision: submission.revision,
    synthetic_qa: true,
  });
  submission.status = input.decision;
  progress.completed = false;
  return progress;
}
export async function saveStagedProgress(db: any, run: any, progress: any) {
  const { data, error } = await db
    .from('ultimate_learner_test_runs')
    .update({ progress })
    .eq('id', run.id)
    .eq('learner_id', run.learner_id)
    .eq('progress', JSON.stringify(run.progress ?? {}))
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('PRACTICAL_PROGRESS_CONFLICT');
}
