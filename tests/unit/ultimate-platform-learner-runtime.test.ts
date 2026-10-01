import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { UltimatePlatformLearnerRuntime } from '../../lib/ultimate-course-builder/adapters/platform-learner-runtime';
import {
  contractHash,
  ULTIMATE_LESSON_CONTRACT_VERSION,
} from '../../lib/ultimate-course-builder/core/lesson-contract';
import { LEARNER_RUNTHROUGH_CHECKS } from '../../lib/ultimate-course-builder/quality/learner-runthrough';
const artifacts = { finished_media_qa: { mediaQA: { inspection: { mediaSha256: 'media' } } } };
const db: any = {
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              single: async () => ({ data: { id: 'lesson-build', artifacts }, error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
};
const input = { courseId: 'course', lessonId: 'lesson', videoUrl: 'https://example.org/video.mp4' };
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function configured() {
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_URL', 'https://browser.example.org/run');
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_SECRET', 'test-secret');
}
function report() {
  return {
    contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
    mediaSha256: 'media',
    artifactHash: contractHash(artifacts),
    lessonBuildId: 'lesson-build',
    testRunId: 'test-run',
    checkedAt: new Date().toISOString(),
    observations: LEARNER_RUNTHROUGH_CHECKS.map((check) => ({
      check,
      passed: true,
      action: 'Performed the check',
      observed: 'Observed its result',
    })),
  };
}
function response(evidence: any) {
  const signature = createHmac('sha256', 'test-secret')
    .update(contractHash(evidence))
    .digest('hex');
  return { ok: true, json: async () => ({ evidence, signature }) };
}
describe('authentic learner evidence', () => {
  it('blocks when no browser worker is configured', async () => {
    vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_URL', '');
    await expect(new UltimatePlatformLearnerRuntime(db).verify(input)).rejects.toThrow(
      'BROWSER_WORKER_NOT_CONFIGURED',
    );
  });
  it('rejects unsigned fabricated results', async () => {
    configured();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ evidence: report(), signature: 'forged' }),
      })),
    );
    await expect(new UltimatePlatformLearnerRuntime(db).verify(input)).rejects.toThrow(
      'SIGNATURE_INVALID',
    );
  });
  it('rejects evidence about a different video even when signed', async () => {
    configured();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ ...report(), mediaSha256: 'other' })),
    );
    await expect(new UltimatePlatformLearnerRuntime(db).verify(input)).rejects.toThrow(
      'VERSION_MISMATCH',
    );
  });
  it('marks a missing observed action untested rather than assuming completion', async () => {
    configured();
    const r = report();
    r.observations = r.observations.filter((o) => o.check !== 'completion');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(r)),
    );
    const result = await new UltimatePlatformLearnerRuntime(db).verify(input);
    expect(result.progress_save).toBe(true);
    expect(result.completion).toBe(false);
  });
});
