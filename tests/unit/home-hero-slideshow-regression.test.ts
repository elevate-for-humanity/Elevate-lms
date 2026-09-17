import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/ui/HomeHeroVideo.tsx'), 'utf8');

describe('homepage hero slideshow rendering', () => {
  it('loads the homepage content before the hero video without a splash transition', () => {
    const homepageHero = fs.readFileSync(
      path.resolve('components/home/PlatformHubHero.tsx'),
      'utf8',
    );

    expect(homepageHero).toContain('SafeHeroVideo');
    expect(homepageHero).toContain('hero-home-fast.mp4');
    expect(homepageHero).toContain('showPosterBeforePlayback');
    expect(homepageHero).toContain('loop');
    expect(homepageHero).toContain('Barber and Cosmetology apprenticeship programs');
    expect(homepageHero).toContain('Training may be free if you qualify for workforce funding');
    expect(homepageHero).toContain('press the orange Schedule WorkOne Orientation button');
    expect(homepageHero).toContain('press Start Elevate Funding Intake');
    expect(homepageHero).not.toContain('data-narration-src="/audio/narration/home-hero.mp3"');
    expect(homepageHero).toContain('className="order-1 flex items-center');
    expect(homepageHero).toContain('className="relative order-2');
  });

  it('loops only the homepage hero visual while narration remains separate', () => {
    const safeHeroVideo = fs.readFileSync(
      path.resolve('components/hero/SafeHeroVideo.tsx'),
      'utf8',
    );

    expect(safeHeroVideo).toContain('loop?: boolean');
    expect(safeHeroVideo).toContain('loop = false');
    expect(safeHeroVideo).toContain('loop={loop}');
    expect(safeHeroVideo).toContain('video.loop = loop');
  });

  it('keeps scripts attached to the Salon Saloon, Razor Image, and Kountry Kutz videos', () => {
    const hostProfiles = fs.readFileSync(
      path.resolve('apps/marketing/app/host-shops/[slug]/page.tsx'),
      'utf8',
    );
    const featuredHosts = fs.readFileSync(
      path.resolve('components/programs/beauty/FeaturedHostPartners.tsx'),
      'utf8',
    );
    const barberPage = fs.readFileSync(
      path.resolve('apps/marketing/app/programs/barber-apprenticeship/page.tsx'),
      'utf8',
    );

    expect(hostProfiles).toContain('data-narration={videoScript}');
    expect(hostProfiles).toContain('tour script');
    expect(featuredHosts).toContain("Welcome to Razor's Image Barbershop");
    expect(featuredHosts).toContain('data-narration={video.script}');
    expect(barberPage).toContain('KOUNTRY_KUTZ_HERO_TRANSCRIPT');
    expect(barberPage).toContain('As the video moves through the shop');
  });

  it('keeps every slide mounted so transitions never expose the placeholder', () => {
    expect(source).toContain('demoSlides={slides.map((candidate)');
    expect(source).toContain('demoActiveSlideIndex={activeSlide}');
    expect(source).toContain('<HeroVideo');
  });

  it('preloads the opening slides and preserves accessible image labels', () => {
    expect(source).toContain('alt: candidate.alt');
    expect(source).toContain('label: candidate.label');
  });

  it('uses one shared salon editorial grade with tightly matched exposure', () => {
    expect(source).toContain(
      "const SALON_EDITORIAL_GRADE = 'contrast-[1.05] saturate-[1.06] sepia-[0.04]'",
    );
    expect(source).toContain('overlayMode="none"');

    const brightnessValues = [...source.matchAll(/exposureClass: 'brightness-\[([0-9.]+)\]'/g)].map(
      (match) => Number(match[1]),
    );
    expect(brightnessValues).toHaveLength(6);
    expect(Math.max(...brightnessValues) - Math.min(...brightnessValues)).toBeCloseTo(0.02, 5);
  });

  it('uses narration sentence boundaries that prevent swallowed phrases', () => {
    expect(source).toContain('build skills by doing real work');
    expect(source).toContain('Employers looking to fill open jobs');
    expect(source).toContain('build a website');
    expect(source).toContain('narrateTranscript');
    expect(source).not.toContain('razors-image-storefront-2026.jpg');
    expect(source).not.toContain('style-and-scissor-salon/contact-card.webp');
    expect(source).not.toContain('Learn by doing, build real confidence');
  });

  it('opens with Salon Saloon and keeps the full hero message ahead of media on mobile', () => {
    const slidesStart = source.indexOf('const HOME_SLIDES');
    const salonSlide = source.indexOf("src: '/images/partners/salon-saloon/team-interior.webp'");
    const kountrySlide = source.indexOf(
      "src: '/images/partners/kountry-kutz/interior-active.webp'",
    );

    expect(salonSlide).toBeGreaterThan(slidesStart);
    expect(salonSlide).toBeLessThan(kountrySlide);
    expect(source).toContain('className="relative z-20 order-1');
    expect(source).toContain('className="relative order-2 w-full');
    expect(source).toContain('h-[clamp(520px,72svh,860px)]');
    expect(source).not.toContain("src: '/images/partners/generations-hair/salon-service.webp'");
    expect(source).toContain('narrateTranscript');
    expect(source).toContain('soundButtonVariant="prominent"');
    expect(source).toContain('ref={mediaRef}');
    expect(source).toContain('entry.intersectionRatio >= 0.1');
    expect(source).not.toContain("matchMedia('(prefers-reduced-motion: reduce)')");
  });

  it('crossfades naturally without unmounting or exposing a blank frame', () => {
    const renderer = fs.readFileSync(path.resolve('components/marketing/HeroVideo.tsx'), 'utf8');
    expect(renderer).toContain('transition-[opacity,transform] duration-1000 ease-in-out');
    expect(renderer).toContain('motion-reduce:transition-none');
    expect(renderer).toContain("'scale-100 opacity-100'");
    expect(renderer).toContain("'scale-[1.015] opacity-0'");
  });
});
