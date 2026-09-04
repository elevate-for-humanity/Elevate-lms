import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/ui/HomeHeroVideo.tsx'), 'utf8');

describe('homepage hero slideshow rendering', () => {
  it('keeps every slide mounted so transitions never expose the placeholder', () => {
    expect(source).toContain('slides.map((candidate, index)');
    expect(source).toContain("index === activeSlide ? 'z-10 scale-100 opacity-100' : 'z-0 scale-[1.015] opacity-0'");
    expect(source).not.toContain('key={\`\${slide.type}-\${slide.src || activeSlide}\`}');
    expect(source).not.toContain('<HeroVideo');
  });

  it('preloads the opening slides and preserves accessible image labels', () => {
    expect(source).toContain('priority={index < 2}');
    expect(source).toContain('alt={candidate.alt}');
    expect(source).toContain('aria-hidden={index !== activeSlide}');
  });

  it('uses one shared salon editorial grade with tightly matched exposure', () => {
    expect(source).toContain("const SALON_EDITORIAL_GRADE = 'contrast-[1.05] saturate-[1.06] sepia-[0.04]'");
    expect(source).toContain('mix-blend-soft-light');

    const brightnessValues = [...source.matchAll(/exposureClass: 'brightness-\\\[([0-9.]+)\\\]'/g)].map(
      (match) => Number(match[1]),
    );
    expect(brightnessValues).toHaveLength(6);
    expect(Math.max(...brightnessValues) - Math.min(...brightnessValues)).toBeLessThanOrEqual(0.02);
  });

  it('uses the sharp Salon Saloon team portrait for the final slide', () => {
    expect(source).toContain("src: '/images/partners/salon-saloon/team-sign.webp'");
    expect(source).not.toContain("src: '/images/partners/generations-hair/salon-service.webp'");
    expect(source).not.toContain("data-narration-src={revisionedHeroAsset('/audio/narration/home-hero.mp3')}");
  });

  it('crossfades naturally without unmounting or exposing a blank frame', () => {
    expect(source).toContain('transition-[opacity,transform] duration-1000 ease-in-out');
    expect(source).toContain('motion-reduce:transition-none');
    expect(source).toContain("'z-10 scale-100 opacity-100'");
    expect(source).toContain("'z-0 scale-[1.015] opacity-0'");
  });
});
