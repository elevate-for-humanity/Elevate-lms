import { describe, expect, it } from 'vitest';
import {
  APPRENTICESHIP_REQUIRED_HOURS,
  getApprenticeshipRequiredHours,
} from '@/lib/compliance/apprenticeship';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { BEAUTY_PROGRAMS } from '@/lib/programs/beauty-programs';

describe('apprenticeship supervised-hour targets', () => {
  it('keeps every beauty apprenticeship and supported alias at 2,000 hours', () => {
    const beautySlugs = [
      'barber-apprenticeship',
      'cosmetology-apprenticeship',
      'esthetician-apprenticeship',
      'esthetics-apprenticeship',
      'nail-tech-apprenticeship',
      'nail-technician-apprenticeship',
      'manicurist-apprenticeship',
    ];

    expect(beautySlugs.map(getApprenticeshipRequiredHours)).toEqual(beautySlugs.map(() => 2000));
    expect(Object.values(APPRENTICESHIP_REQUIRED_HOURS).every((hours) => hours === 2000)).toBe(
      true,
    );
  });

  it('does not invent an hour target for unrelated programs', () => {
    expect(getApprenticeshipRequiredHours('hvac-technician')).toBeNull();
    expect(getApprenticeshipRequiredHours(null)).toBeNull();
  });

  it('keeps each published beauty apprenticeship course breakdown at 2,000 hours', () => {
    for (const program of [
      BARBER_APPRENTICESHIP,
      COSMETOLOGY,
      ESTHETICIAN_APPRENTICESHIP,
      NAIL_TECH,
    ]) {
      expect(Object.values(program.hoursBreakdown).reduce((sum, hours) => sum + hours, 0)).toBe(
        2000,
      );
    }
    expect(BEAUTY_PROGRAMS['nail-technician-apprenticeship'].ojtHours).toBe(2000);
  });
});
