import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('apps/marketing/app/page.tsx'), 'utf8');
const hero = fs.readFileSync(path.resolve('components/home/PlatformHubHero.tsx'), 'utf8');
const pathways = fs.readFileSync(path.resolve('components/home/HomeCareerPathways.tsx'), 'utf8');
const funding = fs.readFileSync(path.resolve('components/home/HomeFunding.tsx'), 'utf8');

describe('homepage platform introduction', () => {
  it('keeps one hero followed by apprenticeships, programs, employers, and supporting content', () => {
    expect(page.indexOf('<PlatformHubHero />')).toBeLessThan(page.indexOf('<HomeCareerPathways />'));
    expect(page.indexOf('<HomeBeautyPriority />')).toBeLessThan(page.indexOf('<HomeFeaturedHostShop />'));
    expect(page.indexOf('<HomeFeaturedHostShop />')).toBeLessThan(page.indexOf('<HomeCareerPathways />'));
    expect(page.indexOf('<HomeCareerPathways />')).toBeLessThan(page.indexOf('<HomeEmployerStrip />'));
    expect(page.indexOf('<HomeFunding />')).toBeLessThan(page.indexOf('<HomeFinalCTA />'));
    expect(page).not.toContain('<HomeHeroVideo');
  });

  it('describes Elevate as the connected hub for the complete workforce journey', () => {
    expect(hero).toContain('One platform for training, apprenticeships, and workforce operations.');
    expect(hero).toContain('Hands-on training');
    expect(hero).toContain('Employer-connected pathways');
    expect(hero).toContain('Funding guidance');
    expect(pathways).toContain('Training may be free for people who qualify.');
    expect(funding).toContain('Not sure how you will pay? Start here.');
  });
});
