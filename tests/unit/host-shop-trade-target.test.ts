import { describe, expect, it } from 'vitest';
import { resolveTradeTarget } from '@/lib/partner/board';

describe('host shop trade target resolution', () => {
  it('configures cosmetology as a time-based apprenticeship', () => {
    expect(resolveTradeTarget('cosmetology-apprenticeship')).toMatchObject({
      programSlug: 'cosmetology-apprenticeship',
      progressModel: 'time_based',
      hours: 2000,
      registered: false,
    });
  });

  it('normalizes the cosmetology shorthand', () => {
    expect(resolveTradeTarget('cosmetology')).toMatchObject({
      programSlug: 'cosmetology-apprenticeship',
      progressModel: 'time_based',
      hours: 2000,
    });
  });

  it('preserves Appendix A competency-based occupations', () => {
    expect(resolveTradeTarget('barber')).toMatchObject({
      programSlug: 'barber-apprenticeship',
      progressModel: 'competency_based',
      registered: true,
      rapidsCode: '0030CB',
    });
  });
});
