import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/home/ScrollNarrator.tsx'), 'utf8');

describe('homepage scroll narration lifecycle', () => {
  it('keeps narration playing through small mobile scroll movement', () => {
    const scrollHandler = source.slice(
      source.indexOf('const stopNarrationAfterLeavingSection'),
      source.indexOf('const toggle ='),
    );
    expect(scrollHandler).toContain('mostVisiblePageSection() === current');
    expect(scrollHandler).toContain('lastNarrationRef.current = null');
    expect(scrollHandler).toContain('stop()');
    expect(source).toContain("window.addEventListener('scroll', stopNarrationAfterLeavingSection");
    expect(source).not.toContain("window.addEventListener('wheel'");
  });

  it('releases narration when no page section owns the viewport', () => {
    const noSection = source.slice(
      source.indexOf('if (!section)'),
      source.indexOf('const text = narrationFor(section)'),
    );
    expect(noSection).toContain('stop()');
    expect(noSection).toContain('lastNarrationRef.current = null');
  });

  it('warms opening narration without speaking until the visitor presses play', () => {
    expect(source).toContain('sections.slice(0, 3).forEach(preload)');
    expect(source).toContain('void narrateVisibleSection();');
  });

  it('does not rebuild scroll listeners for transient playback state', () => {
    expect(source).toContain('}, [stop]);');
  });
});
