import { describe, it, expect, vi } from 'vitest';
import { UltimateBuildRunner } from '../../lib/ultimate-course-builder/core/build-runner';
import {
  contractHash,
  currentEvidence,
  stepInputHash,
  validateStepOutput,
  ULTIMATE_LESSON_CONTRACT_VERSION,
  MAX_TARGETED_REPAIRS,
} from '../../lib/ultimate-course-builder/core/lesson-contract';
import type { UltimateRunContext } from '../../lib/ultimate-course-builder/core/build-runner';
const profile: any = {
  id: 'course:test',
  title: 'Safety',
  authority: 'course-defined',
  standardVersion: '1',
  sourceDocuments: [],
  competencies: [
    {
      id: 'one',
      title: 'Safety',
      description: 'Safety',
      type: 'knowledge',
      authorityRequirementIds: [],
      requiresDemonstration: false,
      requiresPracticalEvidence: false,
    },
  ],
};
const context = (): UltimateRunContext => ({
  buildId: 'test:one',
  courseId: 'test',
  profile,
  artifacts: {},
  findings: [],
  passedSteps: new Set(),
});
const standards = { requirements: { competencies: profile.competencies, version: '1' } };
describe('versioned lesson contract', () => {
  it('rejects label-only QA and empty objectives', () => {
    expect(
      validateStepOutput('finished_media_qa', { mediaQA: { pass: true, distinctShots: 7 } }),
    ).toContain('ENCODED_MP4_INSPECTION_REQUIRED');
    expect(validateStepOutput('learning_objectives', { objectives: [] })).toContain(
      'OBJECTIVE_SOURCE_MAPPING_REQUIRED',
    );
    expect(validateStepOutput('learner_runthrough', { learnerQA: { pass: true } })).toContain(
      'BROWSER_RUNTHROUGH_REQUIRED',
    );
  });
  it('never executes downstream stages after missing content', async () => {
    const downstream = vi.fn();
    const c = context();
    await new UltimateBuildRunner({
      standards_lock: async () => ({ artifacts: standards }),
      learning_objectives: async () => ({ artifacts: { objectives: [] } }),
      prerequisites: downstream,
    }).run(c);
    expect(downstream).not.toHaveBeenCalled();
    expect(c.findings.some((f) => f.code === 'OBJECTIVE_SOURCE_MAPPING_REQUIRED')).toBe(true);
  });
  it('error findings block even if a handler claims passed', async () => {
    const downstream = vi.fn();
    const c = context();
    await new UltimateBuildRunner({
      standards_lock: async () => ({
        artifacts: standards,
        passed: true,
        findings: [
          {
            step: 'standards_lock',
            severity: 'error',
            code: 'SOURCE_INVALID',
            message: 'Invalid source',
          },
        ],
      }),
      learning_objectives: downstream,
    }).run(c);
    expect(downstream).not.toHaveBeenCalled();
  });
  it('binds evidence to exact inputs and output, invalidating tampered checkpoints', () => {
    const hash = stepInputHash('standards_lock', profile, {});
    const a: any = {
      ...standards,
      contractEvidence: {
        version: ULTIMATE_LESSON_CONTRACT_VERSION,
        inputHash: hash,
        outputHash: contractHash(standards),
        passed: true,
      },
    };
    expect(currentEvidence(a, hash)).toBe(true);
    a.requirements = { ...a.requirements, version: '2' };
    expect(currentEvidence(a, hash)).toBe(false);
  });
  it('executes bounded transient repairs and records attempts', async () => {
    let calls = 0;
    const c = context();
    await new UltimateBuildRunner({
      standards_lock: async () => {
        calls++;
        throw new Error('HTTP 503');
      },
    }).run(c);
    expect(calls).toBe(MAX_TARGETED_REPAIRS + 1);
    expect((c.artifacts.selective_repair as any).repair.attempts).toHaveLength(MAX_TARGETED_REPAIRS);
    expect(c.findings).toHaveLength(1);
  });
  it('does not retry absent sources as if a retry could supply them', async () => {
    const handler = vi.fn(async () => {
      throw new Error('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');
    });
    const c = context();
    await new UltimateBuildRunner({ standards_lock: handler }).run(c);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
