import { describe, expect, it } from 'vitest';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { NAIL_TECH_PROGRAM } from '@/lib/program-constants';
import { orientationConfigs } from '@/lms-data/orientationConfig';
import { buildProgramAtAGlance } from '@/lib/programs/program-at-a-glance';
import { getTotalHoursRange } from '@/lib/programs/program-schema';
import { formatProgramDurationWeeks } from '@/lib/programs/marketing-duration';
import { BEAUTY_PROGRAMS, formatBeautyPrice } from '@/lib/programs/beauty-programs';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';

describe('Nail Technician public catalog consistency', () => {
  it('uses competency milestones throughout training and entry-to-license progression', () => {
    const trainingTimeframes = [
      ...NAIL_TECH.outcomes.map(outcome => outcome.assessedAt ?? ''),
      ...NAIL_TECH.weeklySchedule.map(stage => stage.week),
      ...(NAIL_TECH.trainingPhases ?? []).map(phase => phase.weeks),
      ...NAIL_TECH.careerPathway.map(step => step.timeframe),
    ];
    for (const timeframe of trainingTimeframes) {
      expect(timeframe).not.toMatch(/\b(?:week|month|year)s?\b/i);
    }
    expect(NAIL_TECH.careerPathway[1].timeframe).toMatch(/licens/i);
    expect(NAIL_TECH.schedule).toContain('19 Appendix A competencies');
    expect(NAIL_TECH.schedule).toContain('210 required RTI hours');
    expect(NAIL_TECH.weeklySchedule.map(stage => stage.title)).toEqual([
      'Sanitation & Nail Anatomy', 'Manicure & Pedicure', 'Gel & Acrylic Application',
      'Nail Art & Advanced Techniques', 'Exam Prep & Licensing',
    ]);
  });
  it('does not advertise a fixed completion term for the competency-based standard', () => {
    expect(NAIL_TECH.durationWeeks).toBe(0);
    expect(NAIL_TECH_PROGRAM.durationWeeks).toBe(0);
    expect(NAIL_TECH_PROGRAM.durationFormatted).toContain('Competency-based');
    const duration = buildProgramAtAGlance(NAIL_TECH)
      .find((item) => item.question === 'How long does it take?');
    expect(duration?.answer).toContain('Competency-based');
    expect(duration?.answer).not.toMatch(/0 weeks|50 weeks/);
    expect(getTotalHoursRange(NAIL_TECH)).toContain('Competency-based');
    expect(formatProgramDurationWeeks(NAIL_TECH.durationWeeks, true)).toContain('Competency-based');
    expect(formatProgramDurationWeeks(0)).toBe('Duration confirmed during enrollment');
    expect(formatProgramDurationWeeks(6)).toBe('6 weeks');
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
  it('does not mistake employer-paid apprenticeship work for free tuition', () => {
    for (const program of [COSMETOLOGY, ESTHETICIAN_APPRENTICESHIP]) {
      const config = orientationConfigs[program.slug];
      const advertisedTuition = Number(program.selfPayCost.replace(/[^0-9.]/g, ''));
      expect(advertisedTuition).toBe(6000);
      expect(config.tuition.total).toBe(advertisedTuition);
      expect(config.tuition.setupFeePercent).toBe(10);
      expect(config.tuition.fundingNote).toMatch(/Self-pay only/);
      expect(config.tuition.fundingNote).not.toMatch(/no tuition|WIOA|WRG/i);
    }
  });
  it('uses the published tuition and canonical $600 initial invoice in every beauty eligibility route', () => {
    const mappings = [
      ['cosmetology-apprenticeship', COSMETOLOGY],
      ['esthetician', ESTHETICIAN_APPRENTICESHIP],
      ['nail-technician-apprenticeship', NAIL_TECH],
    ] as const;
    for (const [route, program] of mappings) {
      const cfg = BEAUTY_PROGRAMS[route];
      const canonicalTuitionCents = Math.round(Number(program.selfPayCost.replace(/[^0-9.]/g, '')) * 100);
      expect(cfg.fullTuitionCents).toBe(canonicalTuitionCents);
      expect(cfg.depositCents).toBe(getInitialProgramInvoiceCents(program.slug, canonicalTuitionCents));
      expect(formatBeautyPrice(cfg.fullTuitionCents)).toBe('$6,000.00');
      expect(formatBeautyPrice(cfg.depositCents)).toBe('$600.00');
    }
  });
});
