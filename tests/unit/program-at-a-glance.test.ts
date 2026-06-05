import { describe, it, expect } from 'vitest';
import { HVAC_TECHNICIAN } from '@/data/programs/hvac-technician';
import { CNA } from '@/data/programs/cna';
import { buildProgramAtAGlance } from '@/lib/programs/program-at-a-glance';

describe('buildProgramAtAGlance', () => {
  it('returns six workforce questions for HVAC', () => {
    const rows = buildProgramAtAGlance(HVAC_TECHNICIAN);
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.question)).toEqual([
      'When do I start?',
      'How long does it take?',
      'What credential do I earn?',
      'What job can I get?',
      'What does it cost?',
      'Is funding available?',
    ]);
    expect(rows[1].answer).toContain('6 weeks');
  });

  it('CNA duration is 6 weeks in at-a-glance', () => {
    const rows = buildProgramAtAGlance(CNA);
    expect(rows[1].answer).toContain('6 weeks');
  });

  it('includes issuing organization in credential answer', () => {
    const rows = buildProgramAtAGlance(CNA);
    const credential = rows[2].answer;
    expect(credential).toMatch(/issued by/i);
    expect(credential).toContain('Indiana');
  });
});

describe('canonical program durations', () => {
  it('HVAC static catalog is 6 weeks', () => {
    expect(HVAC_TECHNICIAN.durationWeeks).toBe(6);
    expect(HVAC_TECHNICIAN.subtitle).toMatch(/6 weeks/i);
  });

  it('CNA static catalog is 6 weeks', () => {
    expect(CNA.durationWeeks).toBe(6);
    expect(CNA.subtitle).toMatch(/6 weeks/i);
  });
});
