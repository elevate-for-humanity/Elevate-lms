import { describe, expect, it } from 'vitest';
import {
  reviewStagedPractical,
  stagedPracticalComplete,
  submitStagedPractical,
} from '@/lib/ultimate-course-builder/testing/staged-practical';
const artifact = {
  id: 'artifact',
  path: 'run/practical/file.png',
  sha256: 'hash',
  syntheticQA: true,
  runId: 'run',
  lessonBuildId: 'build',
  artifactHash: 'snapshot-hash',
};
const createRun = () => ({
  id: 'run',
  lesson_build_id: 'build',
  artifact_hash: 'snapshot-hash',
  snapshot: {
    qaOnly: true,
    practicalRequired: true,
    practicalLesson: {
      competency_checks: [{ key: 'safe-procedure', requiresInstructorSignoff: true }],
    },
  },
  progress: { qaPracticalArtifacts: [artifact] } as any,
});
const submissionInput = { evidenceId: 'artifact', learnerAttestation: true };
const review = (run: any, decision: string) => ({
  decision,
  lessonBuildId: 'build',
  artifactHash: 'snapshot-hash',
  submissionId: run.progress.practical.id,
  revision: run.progress.practical.revision,
  competencyResults: { 'safe-procedure': decision === 'approved' },
  comments: 'Synthetic QA workflow review',
});

describe('QA-only staged practical storage adapter uses production policy', () => {
  it('requires uploaded scoped evidence and never substitutes written practice or unmarked snapshots', () => {
    const run = createRun();
    expect(() =>
      submitStagedPractical(run, { ...submissionInput, evidenceId: 'not-uploaded' }),
    ).toThrow('PRACTICAL_QA_ARTIFACT_REQUIRED');
    expect(() =>
      submitStagedPractical(run, { ...submissionInput, learnerAttestation: false }),
    ).toThrow('PRACTICAL_EVIDENCE_REQUIRED');
    expect(() =>
      submitStagedPractical(
        { ...run, snapshot: { ...run.snapshot, qaOnly: false } },
        submissionInput,
      ),
    ).toThrow('PRACTICAL_QA_RUN_REQUIRED');
    expect(stagedPracticalComplete(run.snapshot, run.progress)).toBe(false);
  });
  it('persists rejection and required revision before policy-approved current submission can pass', () => {
    const run = createRun();
    run.progress = submitStagedPractical(run, submissionInput, '2026-10-04T10:00:00Z');
    expect(stagedPracticalComplete(run.snapshot, run.progress)).toBe(false);
    run.progress = reviewStagedPractical(
      run,
      review(run, 'rejected'),
      'qa-service:run',
      '2026-10-04T10:01:00Z',
    );
    expect(stagedPracticalComplete(run.snapshot, run.progress)).toBe(false);
    run.progress = submitStagedPractical(run, submissionInput, '2026-10-04T10:02:00Z');
    run.progress = reviewStagedPractical(
      run,
      review(run, 'revision_required'),
      'qa-service:run',
      '2026-10-04T10:03:00Z',
    );
    run.progress = submitStagedPractical(run, submissionInput, '2026-10-04T10:04:00Z');
    run.progress = reviewStagedPractical(
      run,
      review(run, 'approved'),
      'qa-service:run',
      '2026-10-04T10:05:00Z',
    );
    expect(stagedPracticalComplete(run.snapshot, run.progress)).toBe(true);
    expect(run.progress.practicalHistory.map((item: any) => item.status)).toEqual([
      'rejected',
      'revision_required',
    ]);
    expect(run.progress.practical.revision).toBe(3);
    expect(run.progress.practical.synthetic_qa).toBe(true);
    expect(run.progress.completed).toBe(false);
  });
  it('rejects stale versions, wrong build/hash and incomplete competency decisions', () => {
    const run = createRun();
    run.progress = submitStagedPractical(run, submissionInput);
    for (const changes of [
      { revision: 0 },
      { submissionId: 'old' },
      { artifactHash: 'old' },
      { lessonBuildId: 'other' },
    ]) {
      expect(() =>
        reviewStagedPractical(run, { ...review(run, 'approved'), ...changes }, 'qa'),
      ).toThrow('PRACTICAL_QA_REVIEW_SCOPE_MISMATCH');
    }
    expect(() =>
      reviewStagedPractical(run, { ...review(run, 'approved'), competencyResults: {} }, 'qa'),
    ).toThrow('PRACTICAL_APPROVAL_REQUIRES_ALL_COMPETENCIES');
  });
  it('latest persisted review controls completion and client-supplied timestamps are ignored', () => {
    const run = createRun();
    run.progress = submitStagedPractical(run, submissionInput, '2026-10-04T10:00:00Z');
    run.progress = reviewStagedPractical(
      run,
      { ...review(run, 'approved'), reviewed_at: '2099-01-01T00:00:00Z' },
      'qa-service:run',
      '2026-10-04T10:01:00Z',
    );
    expect(run.progress.practical.course_practical_reviews[0].reviewed_at).toBe(
      '2026-10-04T10:01:00Z',
    );
    run.progress.practical.course_practical_reviews.push({
      reviewer_id: 'qa-service:run',
      decision: 'rejected',
      reviewed_at: '2026-10-04T10:02:00Z',
      competency_results: {},
    });
    expect(stagedPracticalComplete(run.snapshot, run.progress)).toBe(false);
  });
});
