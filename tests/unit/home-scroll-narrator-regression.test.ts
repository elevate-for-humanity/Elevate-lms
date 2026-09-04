import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/home/ScrollNarrator.tsx'), 'utf8');

describe('homepage scroll narration lifecycle', () => {
  it('stops active narration immediately when scrolling begins', () => {
    const scrollHandler = source.slice(
      source.indexOf('const stopAndScheduleNarration'),
      source.indexOf('// Resolve the initially visible section'),
    );
    expect(scrollHandler).toContain('lastNarrationRef.current = null');
    expect(scrollHandler).toContain('stop()');
    expect(scrollHandler).toContain('scheduleNarration()');
    expect(source).toContain("window.addEventListener('scroll', stopAndScheduleNarration");
    expect(source).toContain("window.addEventListener('wheel', stopAndScheduleNarration");
    expect(source).not.toContain("window.addEventListener('touchstart', stopAndScheduleNarration");
    expect(source).toContain('const SCROLL_SETTLE_MS = 350');
  });

  it('releases narration when no page section owns the viewport', () => {
    const noSection = source.slice(
      source.indexOf('if (!section)'),
      source.indexOf('const text = narrationFor(section)'),
    );
    expect(noSection).toContain('stop()');
    expect(noSection).toContain('lastNarrationRef.current = null');
  });

  it('warms opening narration and evaluates the initial viewport', () => {
    expect(source).toContain('sections.slice(0, 3).forEach(preload)');
    expect(source).toContain('scheduleNarration();');
  });

  it('does not rebuild scroll listeners for transient playback state', () => {
    expect(source).toContain('[enabled, narrateVisibleSection, stop]');
  });
});
