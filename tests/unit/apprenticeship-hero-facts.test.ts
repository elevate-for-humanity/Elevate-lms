import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import heroBanners from '@/content/heroBanners';
import { PROGRAMS } from '@/lib/programs/canonical-data';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { getPublicPageFacts } from '@/lib/marketing/public-page-facts';

describe('registered apprenticeship hero facts', () => {
  it('keeps the deployed Marketing JSON identical to the canonical source', () => {
    const canonical = JSON.parse(readFileSync('public/data/hero-banners.json', 'utf8'));
    const deployed = JSON.parse(readFileSync('apps/marketing/public/data/hero-banners.json', 'utf8'));
    expect(deployed).toEqual(canonical);
  });
  it.each(['barber-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'])('matches the registered completion model for %s', (slug) => {
    const contract = getRegisteredProgramStandard(slug);
    expect(contract).not.toBeNull();
    if (!contract) throw new Error('Missing registered standard');
    const banner = heroBanners[slug];
    expect(banner.belowHeroSubheadline).toContain(String(contract.completion.competencyCount));
    expect(banner.belowHeroSubheadline).toContain(String(contract.completion.requiredRtiHours));
    expect(banner.transcript).toMatch(/self-pay only/i);
    expect(banner.trustIndicators).toContain('Self-pay only');
    const answer = getPublicPageFacts(`/programs/${slug}`).facts.at(-1)?.answer;
    expect(answer).toContain(`${contract.completion.competencyCount} verified occupational competencies`);
    expect(answer).toContain(`${contract.completion.requiredRtiHours} hours of related technical instruction`);
  });
  it('uses the cosmetology hybrid term and avoids guaranteed wages', () => {
    const banner = heroBanners['cosmetology-apprenticeship'];
    expect(banner.belowHeroSubheadline).toContain('2,000–2,500');
    expect(banner.belowHeroSubheadline).toContain('154');
    expect(banner.transcript).not.toMatch(/wages begin on day one/i);
    expect(banner.secondaryCta?.href).toBe('/partners/host-shops');
  });
  it('keeps every canonical apprenticeship financial record self-pay only', () => {
    for (const program of Object.values(PROGRAMS)) {
      if (program.category === 'apprenticeship') expect(program.fundingOptions).toEqual(['Self-Pay']);
    }
  });
});
