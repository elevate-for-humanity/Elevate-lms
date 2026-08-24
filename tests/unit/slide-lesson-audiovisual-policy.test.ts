import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SlideLesson audiovisual policy', () => {
  const source = readFileSync('remotion-src/compositions/SlideLesson.tsx', 'utf8');

  it('uses a directional readability scrim instead of the rejected full-frame dark overlay', () => {
    expect(source).toContain('rgba(15,23,42,0.50)');
    expect(source).toContain('rgba(15,23,42,0.08)');
    expect(source).not.toContain('rgba(15,23,42,0.82)');
  });

  it('renders narration above unity gain for audible delivery', () => {
    expect(source.match(/<Audio[^>]+volume=\{1\.35\}/g)).toHaveLength(2);
  });
});
