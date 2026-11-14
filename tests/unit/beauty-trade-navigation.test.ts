import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BEAUTY_TRADES, getBeautyTrade } from '@/lib/programs/beauty-trade-navigation';
import { matchesHostShopPresentationProgram, PROGRAM_SLUGS } from '@/lib/programs/host-shop-programs';

describe('distinct public beauty programs and Host Shop navigation', () => {
  it('has exactly four independent, canonical student and shop destinations', () => {
    expect(BEAUTY_TRADES).toHaveLength(4);
    expect(new Set(BEAUTY_TRADES.map(trade => trade.key)).size).toBe(4);
    expect(new Set(BEAUTY_TRADES.map(trade => trade.programHref)).size).toBe(4);
    expect(new Set(BEAUTY_TRADES.map(trade => trade.hostHref)).size).toBe(4);
    for (const trade of BEAUTY_TRADES) {
      expect(getBeautyTrade(trade.key)).toEqual(trade);
      expect(trade.hostHref).toBe(`/partners/host-shops/${trade.key}`);
      expect(trade.programHref).toBe(`/programs/${trade.programSlug}`);
    }
    expect(getBeautyTrade('unrecognized')).toBeUndefined();
  });

  it('places every trade in the actual shared desktop/mobile header', () => {
    const navigation = readFileSync('lib/navigation.ts', 'utf8');
    const header = readFileSync('components/site/Header.tsx', 'utf8');
    expect(header).toContain('<HeaderDesktopNav items={NAV_ITEMS} />');
    expect(header).toContain('<HeaderMobileMenu items={NAV_ITEMS} />');
    for (const trade of BEAUTY_TRADES) {
      expect(navigation).toContain(`href: ROUTES.${{
        barber: 'programsBarber',
        cosmetology: 'programsCosmetology',
        esthetician: 'programsEsthetician',
        'nail-technician': 'programsNailTech',
      }[trade.key]}`);
      expect(navigation).toContain(`href: '${trade.hostHref}'`);
    }
  });

  it('keeps approved trade photography separate and rejects arbitrary URL trade slugs', () => {
    const hub = readFileSync('apps/marketing/app/partners/host-shops/page.tsx', 'utf8');
    const category = readFileSync('apps/marketing/app/partners/host-shops/[trade]/page.tsx', 'utf8');
    expect(hub).toContain('BEAUTY_TRADES.map');
    expect(hub).not.toContain('HostShopMediaCarousel');
    expect(category).toContain('if (!trade) notFound()');
    expect(category).toContain('matchesHostShopPresentationProgram(shop, trade.programSlug)');
    expect(category).toContain('programSlug={trade.programSlug}');
  });

  it('never classifies a cosmetology-primary salon under barbering or vice versa', () => {
    const salon = { programs: [PROGRAM_SLUGS.barber, PROGRAM_SLUGS.cosmetology], primaryProgram: PROGRAM_SLUGS.cosmetology };
    const barber = { programs: [PROGRAM_SLUGS.barber, PROGRAM_SLUGS.cosmetology], primaryProgram: PROGRAM_SLUGS.barber };
    expect(matchesHostShopPresentationProgram(salon, PROGRAM_SLUGS.barber)).toBe(false);
    expect(matchesHostShopPresentationProgram(salon, PROGRAM_SLUGS.cosmetology)).toBe(true);
    expect(matchesHostShopPresentationProgram(barber, PROGRAM_SLUGS.barber)).toBe(true);
    expect(matchesHostShopPresentationProgram(barber, PROGRAM_SLUGS.cosmetology)).toBe(false);
    expect(matchesHostShopPresentationProgram(salon, PROGRAM_SLUGS.nail)).toBe(false);
  });
});
