import { describe, expect, it, vi } from 'vitest';
import { peerOrigin } from '../e2e/helpers/app-origins';
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

  it('resolves Host Shop resume login against the exact LMS browser peer', () => {
    try {
      // Marketing and LMS run on different origins in local Playwright;
      // the deployed acceptance run must use the production LMS origin.
      vi.stubEnv('PLAYWRIGHT_LMS_URL', '');
      vi.stubEnv('PLAYWRIGHT_BASE_URL', 'http://localhost:3000');
      expect(`${peerOrigin('lms')}/host-shop/login`).toBe('http://localhost:3002/host-shop/login');

      vi.stubEnv('PLAYWRIGHT_BASE_URL', 'https://www.elevateforhumanity.org');
      expect(`${peerOrigin('lms')}/host-shop/login`).toBe('https://lms.elevateforhumanity.org/host-shop/login');

      vi.stubEnv('PLAYWRIGHT_LMS_URL', 'https://lms.qa.example.org/');
      expect(`${peerOrigin('lms')}/host-shop/login`).toBe('https://lms.qa.example.org/host-shop/login');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
