import { describe, expect, it } from 'vitest';
import { FORKLIFT_MANUFACTURING as plan } from '@/lib/programs/forklift-manufacturing';
import { FORKLIFT_MANUFACTURING_PROGRAM as program } from '@/data/programs/forklift';
import { normalizePublicProgram } from '@/data/programs';
import { getTotalHoursFromBreakdown } from '@/lib/programs/program-schema';
import { PROGRAMS, LOC_PROGRAM_SPECS } from '@/lib/programs-data';
import { FORKLIFT_DATA } from '@/lib/trades-program-data';

describe('combined forklift and manufacturing public program contract', () => {
  it('budgets exactly 48 online hours across 24 two-hour lessons', () => {
    expect(plan.blocks.map(({ id, hours, lessons }) => ({ id, hours, lessons }))).toEqual([
      { id: 'forklift', hours: 8, lessons: 4 },
      { id: 'assembly', hours: 16, lessons: 8 },
      { id: 'quality', hours: 24, lessons: 12 },
    ]);
    expect(plan.blocks.reduce((sum, block) => sum + block.hours, 0)).toBe(plan.onlineHours);
    expect(plan.blocks.reduce((sum, block) => sum + block.lessons, 0)).toBe(24);
    for (const block of plan.blocks) expect(block.hours / block.lessons).toBe(2);
    expect(getTotalHoursFromBreakdown(program)).toBe(48);
    expect(plan.employerWeeks).toEqual({ min: 2, max: 4 });
    expect(plan.schedule).toContain('practical phase may take longer');
  });

  it('keeps the catalog and legacy trade summaries on the same combined schedule', () => {
    const catalog = PROGRAMS.find((entry) => entry.slug === plan.slug)!;
    expect(catalog.name).toBe(plan.title);
    expect(catalog.duration).toBe(plan.duration);
    expect(FORKLIFT_DATA.duration).toBe(plan.duration);
    expect(FORKLIFT_DATA.totalHours).toContain('48');
    expect(LOC_PROGRAM_SPECS.forklift.totalHours).toContain('48');
    expect(FORKLIFT_DATA.ojtHours).toContain('2–4');
    expect(LOC_PROGRAM_SPECS.forklift.ojtHours).toContain('2–4');
  });

  it('makes no ETPL, WIOA, WRG, free-tuition or OSHA-issued credential claim', () => {
    const normalized = normalizePublicProgram(program);
    for (const publicProgram of [program, normalized]) {
      expect(publicProgram.funding?.etpl_approved).toBe(false);
      expect(publicProgram.funding?.wioa_eligible).toBe(false);
      expect(publicProgram.funding?.wrg_eligible).toBe(false);
      expect(publicProgram.fundingOptions).not.toContain('wioa');
      expect(publicProgram.fundingOptions).not.toContain('wrg');
      expect(publicProgram.credentials).toEqual([]);
      expect(publicProgram.employerPartners).toEqual([]);
      expect(
        publicProgram.credentials.every((credential) => !/OSHA/i.test(credential.issuer)),
      ).toBe(true);
    }
    expect(PROGRAMS.find((entry) => entry.slug === plan.slug)?.etplApproved).toBe(false);
    expect(FORKLIFT_DATA.nextLevelJobsEligible).toBe(false);
    expect(LOC_PROGRAM_SPECS.forklift.nextLevelJobsEligible).toBe(false);
    expect(FORKLIFT_DATA.credentials).toEqual([]);
    expect(LOC_PROGRAM_SPECS.forklift.credentials).toEqual([]);
    expect(program.selfPayCost).toMatch(/confirm/i);
    expect(plan.practicalDisclosure).toContain('do not replace');
    expect(plan.credentialDisclosure).toContain('no external credential is awarded');
  });
});
