import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/ui/HomeHeroVideo.tsx'), 'utf8');

describe('homepage hero slideshow rendering', () => {
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
    expect(brightnessValues).toHaveLength(8);
    expect(Math.max(...brightnessValues) - Math.min(...brightnessValues)).toBeCloseTo(0.02, 5);
  });

  it('uses narration sentence boundaries that prevent swallowed phrases', () => {
    expect(source).toContain('You will learn by doing. You will build real confidence.');
    expect(source).not.toContain('Learn by doing, build real confidence');
  });

  it('opens with Salon Saloon and keeps the full hero message ahead of media on mobile', () => {
    const slidesStart = source.indexOf('const HOME_SLIDES');
    const salonSlide = source.indexOf("src: '/images/partners/salon-saloon/team-sign.webp'");
    const kountrySlide = source.indexOf("src: '/images/partners/kountry-kutz/interior-empty.webp'");

    expect(salonSlide).toBeGreaterThan(slidesStart);
    expect(salonSlide).toBeLessThan(kountrySlide);
    expect(source).toContain('className="relative z-20 order-1');
    expect(source).toContain('className="relative order-2 w-full');
    expect(source).toContain('h-[clamp(300px,46svh,480px)]');
    expect(source).not.toContain("src: '/images/partners/generations-hair/salon-service.webp'");
    expect(source).not.toContain(
      "data-narration-src={revisionedHeroAsset('/audio/narration/home-hero.mp3')}",
    );
  });

  it('crossfades naturally without unmounting or exposing a blank frame', () => {
    const renderer = fs.readFileSync(path.resolve('components/marketing/HeroVideo.tsx'), 'utf8');
    expect(renderer).toContain('transition-[opacity,transform] duration-1000 ease-in-out');
    expect(renderer).toContain('motion-reduce:transition-none');
    expect(renderer).toContain("'scale-100 opacity-100'");
    expect(renderer).toContain("'scale-[1.015] opacity-0'");
  });
});
