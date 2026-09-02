import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('components/home/ScrollNarrator.tsx'), 'utf8');

describe('homepage scroll narration lifecycle', () => {
  it('does not stop active narration for routine scroll scheduling', () => {
    const scheduler = source.slice(
      source.indexOf('const scheduleNarration'),
      source.indexOf("window.addEventListener('scroll'"),
    );
    expect(scheduler).not.toContain('stop()');
  });

  it('does not stop narration while crossing a gap between sections', () => {
    const noSection = source.slice(
      source.indexOf('if (!section)'),
      source.indexOf('const text = narrationFor(section)'),
    );
    expect(noSection).not.toContain('stop()');
    expect(noSection).not.toContain('lastNarrationRef.current = null');
  });

  it('warms opening narration and evaluates the initial viewport', () => {
    expect(source).toContain('sections.slice(0, 3).forEach(preload)');
    expect(source).toContain('scheduleNarration();');
  });

  it('does not rebuild scroll listeners for transient playback state', () => {
    expect(source).toContain('[enabled, narrateVisibleSection, stop]');
  });
});
