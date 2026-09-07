import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRegisteredProgramStandard, isRegisteredProgramSlug } from '@/lib/apprenticeship/registered-program-contract';
import { PUBLIC_ROUTE_REGISTRY } from '@/lib/navigation/public-route-registry';
import { ROUTES } from '@/lib/navigation/routes';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('public information architecture regressions', () => {
  it('publishes canonical high-value destinations in the sitemap registry', () => {
    const routes = new Set(PUBLIC_ROUTE_REGISTRY.map((route) => route.path));
    for (const route of [ROUTES.apply, '/next-steps', '/jobs', '/mobile-app', '/reels']) {
      expect(routes.has(route), `${route} should be discoverable`).toBe(true);
    }
    expect(routes.has('/hire-graduates')).toBe(false);
  });

  it('keeps one employer hub and repairs the historical personal-services route', () => {
    expect(read('apps/marketing/app/hire-graduates/page.tsx')).toContain("permanentRedirect('/employers')");
    expect(read('apps/marketing/app/for-employers/page.tsx')).toContain("redirect('/employers')");
    expect(read('apps/marketing/app/programs/personal-services/page.tsx')).toContain("permanentRedirect('/apprenticeships')");
  });

  it('uses the canonical apprenticeship hub for the homepage primary CTA', () => {
    expect(read('components/ui/HomeHeroVideo.tsx')).toContain('href="/apprenticeships"');
    expect(read('components/home/HomeApprenticeshipSales.tsx')).toContain('href="/apprenticeships"');
  });

  it('keeps a separate automatic program and funding showcase on the homepage', () => {
    const showcase = read('components/home/HomeProgramShowcase.tsx');
    expect(showcase).toContain('window.setInterval');
    expect(showcase).toContain("'/programs/hvac-technician'");
    expect(showcase).toContain("'/programs/cdl-training'");
    expect(showcase).toContain('Funding is limited and is never guaranteed');
    expect(read('apps/marketing/app/page.tsx')).toContain('<HomeProgramShowcase />');
  });

  it('limits registered claims to the approved sponsor standards', () => {
    for (const slug of ['barber-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship']) {
      expect(isRegisteredProgramSlug(slug)).toBe(true);
      expect(getRegisteredProgramStandard(slug)).not.toBeNull();
    }
    expect(isRegisteredProgramSlug('cosmetology-apprenticeship')).toBe(false);
    expect(isRegisteredProgramSlug('culinary-apprenticeship')).toBe(false);
  });

  it('keeps the Barber hero narration competency-based', () => {
    const banners = read('public/data/hero-banners.json');
    expect(banners).toContain('14 verified occupational competencies and 260 hours of related instruction');
    expect(banners).not.toContain('2,000 hours earn-while-you-learn pathway');
  });

  it('does not publish stale federal registration claims for cosmetology or culinary', () => {
    expect(read('data/programs/cosmetology-apprenticeship.ts')).not.toContain("standard: 'DOL Registered Apprenticeship'");
    expect(read('data/programs/culinary-apprenticeship.ts')).not.toContain("standard: 'DOL Registered Apprenticeship'");
  });
});
