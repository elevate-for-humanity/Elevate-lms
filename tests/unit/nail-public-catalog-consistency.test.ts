import { describe, expect, it } from 'vitest';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import { NAIL_TECH_PROGRAM } from '@/lib/program-constants';
import { orientationConfigs } from '@/lms-data/orientationConfig';
import { buildProgramAtAGlance } from '@/lib/programs/program-at-a-glance';
import { getTotalHoursRange } from '@/lib/programs/program-schema';

describe('Nail Technician public catalog consistency', () => {
  it('does not advertise a fixed completion term for the competency-based standard', () => {
    expect(NAIL_TECH.durationWeeks).toBe(0);
    expect(NAIL_TECH_PROGRAM.durationWeeks).toBe(0);
    expect(NAIL_TECH_PROGRAM.durationFormatted).toContain('Competency-based');
    const duration = buildProgramAtAGlance(NAIL_TECH)
      .find((item) => item.question === 'How long does it take?');
    expect(duration?.answer).toContain('Competency-based');
    expect(duration?.answer).not.toMatch(/0 weeks|50 weeks/);
    expect(getTotalHoursRange(NAIL_TECH)).toContain('Competency-based');
  });

  it('uses the same $6,000 published tuition and $600 deposit percentage in both orientation aliases', () => {
    expect(NAIL_TECH.selfPayCost).toBe('$6,000');
    expect(NAIL_TECH_PROGRAM.tuitionCents).toBe(600000);
    for (const slug of ['nail-tech-apprenticeship', 'nail-technician-apprenticeship']) {
      const config = orientationConfigs[slug];
      expect(config.tuition.total).toBe(6000);
      expect(config.tuition.setupFeePercent).toBe(10);
      expect(config.tuition.fundingNote).toMatch(/Self-pay only/);
      expect(config.tuition.fundingNote).not.toMatch(/WIOA|WRG/);
    }
  });
});
