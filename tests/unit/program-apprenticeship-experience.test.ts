import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(file, 'utf8');

describe('program and apprenticeship experience regressions', () => {
  it('routes workforce and attendance actions to their actual product destinations', () => {
    const source = read('components/home/HomePlatformOverview.tsx');
    expect(source).toContain('https://app.elevateforhumanity.org/apprentice/timeclock');
    expect(source).toContain("href: '/platform/workforce-boards'");
  });

  it('shows one PARIS launcher at a time', () => {
    const source = read('components/paris/ParisFloatingButton.tsx');
    expect(source).toContain('!showWelcome && !isOpen ? (');
  });

  it('keeps program narration active after the hero leaves the viewport', () => {
    const source = read('components/marketing/HeroVideo.tsx');
    expect(source).toContain('Leaving the hero must not interrupt narration');
    expect(source).toContain(
      'if (!entry?.isIntersecting || entry.intersectionRatio < 0.2) return;',
    );
  });

  it('keeps Salon Saloon visible if its video cannot load and publishes its script', () => {
    const showcase = read('components/programs/beauty/HostShopShowcase.tsx');
    const directory = read('components/programs/beauty/FeaturedHostPartners.tsx');
    const partners = read('lib/apprenticeship-programs/host-partners.ts');
    expect(showcase).toContain('failedVideos');
    expect(showcase).toContain('image.backdropSrc');
    expect(showcase).toContain('onError={() =>');
    expect(directory).toContain('Read the Salon Saloon video script');
    expect(partners).toContain('Welcome to Salon Saloon in South Bend, Indiana');
  });

  it('provides a real interactive workforce demo instead of redirecting to admin', () => {
    const page = read('apps/marketing/app/store/demo/institutional/page.tsx');
    const workspace = read(
      'apps/marketing/app/store/demo/institutional/InstitutionalDemoWorkspace.tsx',
    );
    expect(page).toContain('<InstitutionalDemoWorkspace />');
    expect(page).not.toContain('href="/store/demo/admin"');
    expect(workspace).toContain("'use client'");
    expect(workspace).toContain('onClick={() => setActiveId(view.id)}');
  });

  it('uses an available orientation video instead of the missing generated asset', () => {
    const source = read(
      'apps/marketing/app/programs/barber-apprenticeship/orientation/OrientationClient.tsx',
    );
    expect(source).not.toContain('src="/videos/barber-lessons/barber-apprenticeship-intro.mp4"');
    expect(source).toContain('r2.dev/videos/barber-hero-final.mp4');
  });
});
