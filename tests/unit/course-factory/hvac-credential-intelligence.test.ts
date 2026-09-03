import { describe, expect, it } from 'vitest';
import { HVAC_EPA608_BLUEPRINT } from '@/lib/curriculum/blueprints/hvac-epa-608';

describe('HVAC credential intelligence', () => {
  it('uses original, source-grounded EPA 608 material and the instructional renderer', () => {
    expect(HVAC_EPA608_BLUEPRINT.version).toBe('2.0.0');
    expect(HVAC_EPA608_BLUEPRINT.sourceAuthority).toBe('U.S. Environmental Protection Agency');
    expect(HVAC_EPA608_BLUEPRINT.sourceReference).toContain('40 CFR Part 82, Subpart F');
    expect(HVAC_EPA608_BLUEPRINT.generationRules.originalContentRequired).toBe(true);
    expect(HVAC_EPA608_BLUEPRINT.generationRules.prohibitProtectedExamQuestions).toBe(true);
    expect(HVAC_EPA608_BLUEPRINT.videoConfig?.videoGenerator).toBe('remotion');
    expect(HVAC_EPA608_BLUEPRINT.videoConfig?.template).toBe('trade-demonstration');
    expect(HVAC_EPA608_BLUEPRINT.videoConfig?.generateDalleImage).toBe(false);
  });

  it('does not require third-party prep courseware', () => {
    expect(HVAC_EPA608_BLUEPRINT.externalCourses).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ provider: 'ESCO Institute' })]),
    );
    expect(HVAC_EPA608_BLUEPRINT.externalCourses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: 'EPA-approved certifying organization', required: true }),
      ]),
    );
  });
});
