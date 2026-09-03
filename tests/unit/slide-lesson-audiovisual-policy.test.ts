import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { instructionalLayoutForTitle } from '../../remotion-src/instructional-layout';

describe('SlideLesson audiovisual policy', () => {
  const source = readFileSync('remotion-src/compositions/SlideLesson.tsx', 'utf8');
  const renderer = readFileSync('lib/video/remotion-render.ts', 'utf8');

  it('uses a directional readability scrim instead of the rejected full-frame dark overlay', () => {
    expect(source).toContain('rgba(15,23,42,0.50)');
    expect(source).toContain('rgba(15,23,42,0.08)');
    expect(source).not.toContain('rgba(15,23,42,0.82)');
  });

  it('renders narration above unity gain for audible delivery', () => {
    expect(source.match(/<Audio[^>]+volume=\{1\.35\}/g)).toHaveLength(2);
  });

  it('uses lip-synced instructor video only for the opening scene', () => {
    expect(renderer).toContain("index === 0 && process.env.DID_API_KEY");
    expect(renderer).toContain("resolvedProvider: 'd-id'");
    expect(renderer).toContain("resolvedModel: 'talks-lip-sync'");
  });

  it('renders exact ESB teaching structures instead of generic stock footage', () => {
    expect(instructionalLayoutForTitle('Business plan structure')).toMatchObject({
      kind: 'business-plan',
      items: expect.arrayContaining(['Executive Summary', 'Financial Projections']),
    });
    expect(instructionalLayoutForTitle('Pitch deck sequence')).toMatchObject({
      kind: 'pitch-deck',
      items: expect.arrayContaining(['Problem', 'The Ask']),
    });
    expect(instructionalLayoutForTitle('The nine-section Lean Canvas')).toMatchObject({
      kind: 'lean-canvas',
      items: expect.arrayContaining(['Problem', 'Unfair Advantage']),
    });
  });

  it('keeps unrelated course scenes on the cinematic layout', () => {
    expect(instructionalLayoutForTitle('Cinematic entrepreneur opening')).toBeNull();
  });
});
