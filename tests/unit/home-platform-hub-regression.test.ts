import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('apps/marketing/app/page.tsx'), 'utf8');
const hero = fs.readFileSync(path.resolve('components/home/PlatformHubHero.tsx'), 'utf8');
const pathways = fs.readFileSync(path.resolve('components/home/HomeCareerPathways.tsx'), 'utf8');
const funding = fs.readFileSync(path.resolve('components/home/HomeFunding.tsx'), 'utf8');

describe('homepage platform introduction', () => {
  it('preserves the main hero and keeps HVAC and employer paths near the top', () => {
    expect(page.indexOf('<PlatformHubHero />')).toBeLessThan(
      page.indexOf('<HvacTrainingShowcase compact />'),
    );
    expect(page.indexOf('<HvacTrainingShowcase compact />')).toBeLessThan(
      page.indexOf('<HomeEmployerStrip />'),
    );
    expect(page.indexOf('<HomeEmployerStrip />')).toBeLessThan(
      page.indexOf('<HomeCareerPathways />'),
    );
    expect(page).not.toContain('<HomeFunding />');
    expect(page).not.toContain('Get your taxes prepared. Start your own tax office.');
    expect(pathways).not.toContain("slug: 'hvac-technician'");
    expect(page).toContain('Learn how to start your own tax preparation business');
  });

  it('describes Elevate as the connected hub for the complete workforce journey', () => {
    expect(hero).toContain('Build a career. Build a workforce. Build a business.');
    expect(hero).toContain('career training, state and workforce funding pathways');
    expect(hero).toContain('Employers & Partners');
    expect(hero).toContain('Check Funding Options');
    expect(pathways).toContain(
      'programs; eligibility and authorization are determined individually.',
    );
    expect(funding).toContain('Complete your orientation, then connect it to Elevate.');
  });
});
