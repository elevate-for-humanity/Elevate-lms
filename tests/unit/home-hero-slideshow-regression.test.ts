import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/ui/HomeHeroVideo.tsx'), 'utf8');

describe('homepage hero slideshow rendering', () => {
  it('keeps every slide mounted so transitions never expose the placeholder', () => {
    expect(source).toContain('slides.map((candidate, index)');
    expect(source).toContain("index === activeSlide ? 'z-10 opacity-100' : 'z-0 opacity-0'");
    expect(source).not.toContain('key={\`\${slide.type}-\${slide.src || activeSlide}\`}');
    expect(source).not.toContain('<HeroVideo');
  });

  it('preloads the opening slides and preserves accessible image labels', () => {
    expect(source).toContain('priority={index < 2}');
    expect(source).toContain('alt={candidate.alt}');
    expect(source).toContain('aria-hidden={index !== activeSlide}');
  });

  it('uses brighter coordinated treatments for the professional photo set', () => {
    const brightnessValues = [...source.matchAll(/brightness-\\\[([0-9.]+)\\\]/g)].map(
      (match) => Number(match[1]),
    );
    expect(brightnessValues).toHaveLength(6);
    expect(Math.min(...brightnessValues)).toBeGreaterThanOrEqual(1.1);
  });
});
