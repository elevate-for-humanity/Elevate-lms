import { describe, expect, it } from 'vitest';
import {
  normalizeHostShopProgram,
  matchesHostShopProgram,
  PROGRAM_SLUGS,
} from '@/lib/programs/host-shop-programs';

describe('public Host Shop trade categories', () => {
  it('recognizes the current database nail and esthetics spellings', () => {
    expect(normalizeHostShopProgram('nail_technician')).toBe(PROGRAM_SLUGS.nail);
    expect(normalizeHostShopProgram('NAILS')).toBe(PROGRAM_SLUGS.nail);
    expect(normalizeHostShopProgram('esthetics')).toBe(PROGRAM_SLUGS.esthetician);
    expect(normalizeHostShopProgram('BARBER')).toBe(PROGRAM_SLUGS.barber);
    expect(normalizeHostShopProgram('not an approved trade')).toBeNull();
  });
  it('includes a dual-approved salon in each approved occupation', () => {
    const salon = {
      programs: [PROGRAM_SLUGS.cosmetology, PROGRAM_SLUGS.barber, PROGRAM_SLUGS.nail],
      primaryProgram: PROGRAM_SLUGS.cosmetology,
    };
    expect(matchesHostShopProgram(salon, PROGRAM_SLUGS.cosmetology)).toBe(true);
    expect(matchesHostShopProgram(salon, PROGRAM_SLUGS.barber)).toBe(true);
    expect(matchesHostShopProgram(salon, PROGRAM_SLUGS.nail)).toBe(true);
    expect(salon.programs).toContain(PROGRAM_SLUGS.barber);
  });
  it('keeps a barber business off the cosmetology page', () => {
    const barber = { programs: [PROGRAM_SLUGS.barber], primaryProgram: PROGRAM_SLUGS.barber };
    expect(matchesHostShopProgram(barber, PROGRAM_SLUGS.barber)).toBe(true);
    expect(matchesHostShopProgram(barber, PROGRAM_SLUGS.cosmetology)).toBe(false);
  });
  it('never assigns an unknown shop to a trade by default', () => {
    const unclassified = { programs: [] };
    for (const program of Object.values(PROGRAM_SLUGS))
      expect(matchesHostShopProgram(unclassified, program)).toBe(false);
  });
});
