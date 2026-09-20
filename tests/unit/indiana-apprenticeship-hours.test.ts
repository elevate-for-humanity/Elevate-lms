import { describe, expect, it } from 'vitest';
import { APPRENTICESHIP_REQUIRED_HOURS } from '@/lib/compliance/apprenticeship';
import { APPENDIX_A_STANDARDS } from '@/lib/compliance/appendix-a-standards';
import {
  BARBER_PROGRAM,
  COSMETOLOGY_PROGRAM,
  ESTHETICIAN_PROGRAM,
  NAIL_TECH_PROGRAM,
} from '@/lib/program-constants';

describe('Indiana beauty apprenticeship hours', () => {
  it('uses 2,000 OJL hours for every public beauty apprenticeship', () => {
    expect(APPRENTICESHIP_REQUIRED_HOURS).toMatchObject({
      'barber-apprenticeship': 2000,
      'cosmetology-apprenticeship': 2000,
      'esthetician-apprenticeship': 2000,
      'nail-tech-apprenticeship': 2000,
      'nail-technician-apprenticeship': 2000,
    });

    for (const program of [
      BARBER_PROGRAM,
      COSMETOLOGY_PROGRAM,
      ESTHETICIAN_PROGRAM,
      NAIL_TECH_PROGRAM,
    ]) {
      expect(program.totalHours).toBe(2000);
      expect(program.totalHoursFormatted).toBe('2,000');
    }
  });

  it('keeps OJL separate from occupation-specific RTI and competencies', () => {
    for (const standard of Object.values(APPENDIX_A_STANDARDS)) {
      expect(standard.totalOjlHours).toBe(2000);
      expect(standard.relatedInstructionHours).toBeGreaterThan(0);
      expect(standard.competencyCount).toBeGreaterThan(0);
    }
  });
});
