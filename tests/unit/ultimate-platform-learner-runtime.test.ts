import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { UltimatePlatformLearnerRuntime } from '../../lib/ultimate-course-builder/adapters/platform-learner-runtime';
import {
  contractHash,
  ULTIMATE_LESSON_CONTRACT_VERSION,
} from '../../lib/ultimate-course-builder/core/lesson-contract';
import { LEARNER_RUNTHROUGH_CHECKS } from '../../lib/ultimate-course-builder/quality/learner-runthrough';
import { publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
import { simulationFixture } from '../fixtures/manufacturing-simulation';
const artifacts = { finished_media_qa: { mediaQA: { inspection: { mediaSha256: 'media' } } } };
let currentArtifacts: unknown = artifacts;
const query: any = {
  select: () => query, eq: vi.fn(() => query), order: () => query, limit: () => query,
  single: async () => ({ data: { id: 'lesson-build', artifacts: currentArtifacts }, error: null }),
};
const db: any = { from: () => query };
const input = { lessonBuildId: 'lesson-build', courseId: 'course', lessonId: 'lesson', videoUrl: 'https://example.org/video.mp4' };
afterEach(() => {
  query.eq.mockClear();
  currentArtifacts = artifacts;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function configured() {
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_URL', 'https://browser.example.org/run');
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_SECRET', 'test-secret');
}
function report(inputArtifacts: unknown = artifacts) {
  return {
    contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
    mediaSha256: 'media',
    artifactHash: contractHash(inputArtifacts),
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
  const simulation = publicManufacturingSimulation({ ...simulationFixture, gradingKeyId: '30000000-0000-4000-8000-000000000001' });
  const manufacturingReport = () => ({
    ...report(currentArtifacts),
    manufacturingWorkflow: {
      version: 'staged-manufacturing-qa-v1', simulationId: simulation.id, gradingKeyId: simulation.gradingKeyId,
      specHash: contractHash(simulation), taskCount: simulation.tasks.length, deniedBefore: true,
      deniedCritical: true, submittedThroughUI: true, score: 100, criticalMisses: 0, persisted: true, completionObserved: true,
    },
  });
  function manufacturingArtifacts() {
    currentArtifacts = { ...artifacts, assessment_alignment: { authoredPreservation: { experience: { manufacturingSimulation: simulation } } } };
  }

  it('accepts exact signed simulation workflow evidence bound to the current public problem', async () => {
    configured();
    manufacturingArtifacts();
    vi.stubGlobal('fetch', vi.fn(async () => response(manufacturingReport())));
    expect((await new UltimatePlatformLearnerRuntime(db).verify(input)).completion).toBe(true);
  });

  it.each(['missing', 'version', 'simulationId', 'gradingKeyId', 'specHash', 'taskCount', 'deniedBefore', 'deniedCritical',
    'submittedThroughUI', 'score', 'criticalMisses', 'persisted', 'completionObserved'])('rejects signed generic or incomplete simulation evidence: %s', async field => {
    configured();
    manufacturingArtifacts();
    const evidence: any = manufacturingReport();
    if (field === 'missing') delete evidence.manufacturingWorkflow;
    else evidence.manufacturingWorkflow[field] = field === 'score' ? 80 : field === 'criticalMisses' ? 1 : false;
    vi.stubGlobal('fetch', vi.fn(async () => response(evidence)));
    await expect(new UltimatePlatformLearnerRuntime(db).verify(input)).rejects.toThrow('ULTIMATE_MANUFACTURING_BROWSER_EVIDENCE_REQUIRED');
  });

  it('pins the exact current lesson build instead of selecting the latest course attempt', async () => {
    configured();
    vi.stubGlobal('fetch', vi.fn(async () => response(report())));
    await new UltimatePlatformLearnerRuntime(db).verify(input);
    expect(query.eq).toHaveBeenCalledWith('id', 'lesson-build');
    expect(query.eq).toHaveBeenCalledWith('competency_id', 'lesson');
    expect(query.eq).toHaveBeenCalledWith('ultimate_course_builds.course_id', 'course');
  });

  it('retries a rejected browser capacity admission without inventing test evidence', async () => {
    configured();
    vi.useFakeTimers();
    try {
      const accepted = response({
        ...report(),
        checkedAt: new Date().toISOString(),
      });
      const browser = vi.fn()
        .mockResolvedValueOnce({ status: 429, ok: false, body: { cancel: vi.fn() } })
        .mockResolvedValueOnce(accepted);
      vi.stubGlobal('fetch', browser);
      const pending = new UltimatePlatformLearnerRuntime(db).verify(input);
      await vi.advanceTimersByTimeAsync(15000);
      const result = await pending;
      expect(browser).toHaveBeenCalledTimes(2);
      expect(result.completion).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it('rejects a lesson changed while its browser test was running', async () => {
    configured();
    vi.stubGlobal('fetch', vi.fn(async () => {
      currentArtifacts = { ...artifacts, replacedLesson: true };
      return response(report());
    }));
    await expect(new UltimatePlatformLearnerRuntime(db).verify(input)).rejects.toThrow('LESSON_CHANGED_DURING_TEST');
  });
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
