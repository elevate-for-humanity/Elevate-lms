import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('apps/marketing/app/page.tsx'), 'utf8');
const hero = fs.readFileSync(path.resolve('components/home/PlatformHubHero.tsx'), 'utf8');
const pathways = fs.readFileSync(path.resolve('components/home/HomeCareerPathways.tsx'), 'utf8');
const funding = fs.readFileSync(path.resolve('components/home/HomeFunding.tsx'), 'utf8');

describe('homepage platform introduction', () => {
  it('keeps one hero, the curated shops, career paths, funding and enrollment in order', () => {
    expect(page.match(/<PlatformHubHero \/>/g)).toHaveLength(1);
    const elements = ['<PlatformHubHero />', '<HomeFeaturedHostShop />', '<HomeCareerPathways />', 'id="workone-home-cta"', '<HomeNetworks />', '<HomeFinalCTA />', '<HomeTrustBar />'];
    const positions = elements.map(element => page.indexOf(element));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(page).not.toContain('<HomeHeroVideo');
  });

  it('offers the current training pathways and qualified funding without a second hero', () => {
    expect(hero).toContain('career training and apprenticeships');
    for (const pathway of ['/programs/hvac-technician', '/programs/cdl-training', '/programs/bookkeeping', '/programs/business']) {
      expect(pathways).toContain(pathway);
    }
    expect(page).toContain('Free to those who qualify; eligibility and program requirements apply.');
    expect(page).toContain('href={WORKONE_INDY_BOOKING_URL}');
    expect(funding).toContain('Not sure how you will pay? Start here.');
  });
});
