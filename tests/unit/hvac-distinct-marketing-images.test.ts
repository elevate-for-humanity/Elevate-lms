import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('HVAC marketing image separation', () => {
  it('uses distinct homepage and program-gallery scenes and defers below-fold cards', () => {
    const source = readFileSync('components/programs/HvacTrainingShowcase.tsx', 'utf8');
    expect(source).toContain('compact ? scenes.slice(0, 3) : scenes.slice(3)');
    expect(source).toContain('loading="lazy"');
    expect(source).not.toContain('priority={compact && index === 0}');
  });
});
