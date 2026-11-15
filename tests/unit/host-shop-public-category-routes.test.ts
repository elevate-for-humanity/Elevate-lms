import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '@/lib/navigation';
import { BEAUTY_TRADES } from '@/lib/programs/beauty-trade-navigation';

describe('public Host Shop category navigation contract', () => {
  it('retains independent, exact program and shop routes for all four beauty trades', () => {
    expect(BEAUTY_TRADES.map(trade => [trade.key, trade.programSlug, trade.hostHref, trade.programHref])).toEqual([
      ['barber', 'barber-apprenticeship', '/partners/host-shops/barber', '/programs/barber-apprenticeship'],
      ['cosmetology', 'cosmetology-apprenticeship', '/partners/host-shops/cosmetology', '/programs/cosmetology-apprenticeship'],
      ['esthetician', 'esthetician-apprenticeship', '/partners/host-shops/esthetician', '/programs/esthetician-apprenticeship'],
      ['nail-technician', 'nail-technician-apprenticeship', '/partners/host-shops/nail-technician', '/programs/nail-technician-apprenticeship'],
    ]);
    const routes = NAV_ITEMS.flatMap(item => [
      item.href,
      ...(item.subItems ?? []).map(subItem => subItem.href),
    ]);
    for (const trade of BEAUTY_TRADES) {
      expect(routes).toContain(trade.hostHref);
      expect(routes).toContain(trade.programHref);
    }
    expect(new Set(BEAUTY_TRADES.map(trade => trade.hostHref)).size).toBe(4);
    expect(new Set(BEAUTY_TRADES.map(trade => trade.programHref)).size).toBe(4);
  });
});
