import { describe, it, expect } from 'vitest';
import { isDurableExternalBlocker, routeSelectiveRepairs } from '@/lib/ultimate-course-builder/core/repair-router';
import { nextCourseWork } from '@/lib/ultimate-course-builder/worker/course-cursor';
import { UltimatePlatformInstructionalGenerator } from '@/lib/ultimate-course-builder/adapters/platform-instructional-generator';

// A course-defined build with no saved authorized teaching text. This is the
// real shape that produced COURSE_EXECUTION_FAILED on build 4c9d004f: one
// fallback competency and an empty instructionalSources array.
const sourceLessProfile = {
  id: 'course:1cdf101e-b0b8-4393-8fe4-20e8217f97a4',
  title: 'Culinary Training Pathway',
  authority: 'course-defined',
  standardVersion: '1',
  sourceDocuments: [],
  instructionalSources: [],
  competencies: [
    {
      id: 'course-1cdf101e-b0b8-4393-8fe4-20e8217f97a4',
      title: 'Culinary Training Pathway',
      description: 'Build course from saved curriculum.',
      type: 'knowledge' as const,
      authorityRequirementIds: [],
      requiresDemonstration: false,
      requiresPracticalEvidence: false,
    },
  ],
};

describe('missing authorized teaching source is an external blocker, not a code repair', () => {
  it('the real instructional producer raises the exact reported code without sources', async () => {
    const competency = sourceLessProfile.competencies[0];
    await expect(
      new UltimatePlatformInstructionalGenerator().blueprint({ profile: sourceLessProfile, competency }),
    ).rejects.toThrow('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');
  });

  it('classifies the producer failure as durable so the worker parks it instead of opening a code repair', () => {
    // Mirrors the worker failure path, which derives the code from the message.
    const message = 'ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED';
    expect(isDurableExternalBlocker({
      code: message.split(':')[0], step: 'learning_objectives', severity: 'error', message,
    } as any)).toBe(true);
  });

  it('routes no producer repair for a defect that no code change can correct', () => {
    expect(routeSelectiveRepairs([{
      step: 'learning_objectives',
      severity: 'error',
      code: 'ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED',
      message: 'ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED',
    } as any])).toEqual([]);
  });

  it('does not consume bounded lesson repair attempts for the missing source', () => {
    const competencyId = sourceLessProfile.competencies[0].id;
    const work = nextCourseWork(
      { nextCompetencyIndex: 0 },
      {
        completed: false,
        lessons: [{ competencyId }],
        findings: [{ step: 'learning_objectives', severity: 'error', code: 'ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED' }],
      },
    );
    expect(work.continue).toBe(false);
    expect(work.unresolved).toEqual([competencyId]);
    expect(work.payload.lessonRepairCounts[competencyId]).toBeUndefined();
  });
});
