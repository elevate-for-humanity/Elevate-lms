import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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

  it('keeps current refrigerant classifications and Type I recovery rules straight', () => {
    const source = readFileSync('scripts/backfill-hvac-script-text.ts', 'utf8');
    expect(source).toContain('90% if the compressor is operational, 80% if it is not');
    expect(source).toContain('R-32</strong> is an HFC');
    expect(source).toContain('R-454B</strong> is an HFC/HFO blend');
    expect(source).not.toContain('HFOs (R-32, R-454B)');
    expect(source).not.toContain('80% if compressor works, 90% if it does not');
    expect(source).not.toContain('15% for comfort cooling');
  });
});
