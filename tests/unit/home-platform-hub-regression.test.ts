import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('apps/marketing/app/page.tsx'), 'utf8');
const hero = fs.readFileSync(path.resolve('components/home/PlatformHubHero.tsx'), 'utf8');
const about = fs.readFileSync(path.resolve('components/home/HomeAboutElevate.tsx'), 'utf8');

describe('homepage platform introduction', () => {
  it('places the platform hero and explanation before the preserved Host Shop slideshow', () => {
    expect(page.indexOf('<PlatformHubHero />')).toBeLessThan(page.indexOf('<HomeAboutElevate />'));
    expect(page.indexOf('<HomeAboutElevate />')).toBeLessThan(
      page.indexOf('<HomeHeroVideo banner={heroBanners.home} />'),
    );
  });

  it('describes Elevate as the connected hub for the complete workforce journey', () => {
    expect(hero).toContain('Elevate for Humanity career training and apprenticeships');
    expect(hero).toContain('priority');
    expect(about).toContain('Who Elevate is');
    expect(about).toContain('learners');
    expect(about).toContain('employers and Host Shops');
    expect(about).toContain('workforce partners');
  });
});
