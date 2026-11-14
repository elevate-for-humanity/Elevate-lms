import { describe, expect, it } from 'vitest';
import {
  BEAUTY_APPRENTICESHIP_CONFIG,
  getBeautyApprenticeshipConfig,
} from '@/lib/apprenticeship/beauty-program-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

describe('beauty apprenticeship portal contract', () => {
  it('defines the same portal configuration for all four beauty pathways', () => {
    expect(Object.keys(BEAUTY_APPRENTICESHIP_CONFIG)).toEqual([
      'barber-apprenticeship',
      'cosmetology-apprenticeship',
      'esthetician-apprenticeship',
      'nail-technician-apprenticeship',
    ]);
    for (const config of Object.values(BEAUTY_APPRENTICESHIP_CONFIG)) {
      expect(config.portalLabel).toContain('Apprentice Portal');
      expect(config.hostLabel).toMatch(/Host/);
      expect(config.syllabusHref).toMatch(/^\//);
    }
  });

  it('uses only canonical approved Appendix A standards', () => {
    expect(getRegisteredProgramStandard('barber-apprenticeship')?.standard.rapidsCode).toBe('0030CB');
    expect(getRegisteredProgramStandard('esthetician-apprenticeship')?.standard.rapidsCode).toBe('2089CB');
    expect(getRegisteredProgramStandard('nail-technician-apprenticeship')?.standard.rapidsCode).toBe('2090CB');
    expect(getRegisteredProgramStandard('cosmetology-apprenticeship')).toBeNull();
  });

  it('does not provide a beauty configuration to unrelated programs', () => {
    expect(getBeautyApprenticeshipConfig('hvac-technician')).toBeNull();
  });
});
