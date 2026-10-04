import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlueprintTeachingGraphic } from '../../remotion-src/compositions/BlueprintTeachingGraphic';
import { teachingPresentation } from '@/lib/ultimate-course-builder/instructional/teaching-presentation';
import type { TeachingVisual } from '@/lib/ultimate-course-builder/instructional/teaching-visual';

const steps = ['Date', 'Activity', 'Duration', 'Reviewer'].map(label => ({
  label, value: `Authored ${label}`, narrationQuote: `Authored ${label}`,
}));
describe('composed blueprint teaching states', () => {
  it('renders records as changing labeled fields without fabricating approval', () => {
    const plan: TeachingVisual = { kind: 'record', steps };
    const initial = renderToStaticMarkup(<BlueprintTeachingGraphic plan={plan} seconds={0} duration={40} color="#123456" />);
    const next = renderToStaticMarkup(<BlueprintTeachingGraphic plan={plan} seconds={15} duration={40} color="#123456" />);
    expect(initial).toContain('<dt'); expect(initial).not.toContain('Authored Activity');
    expect(next).toContain('Authored Date'); expect(next).toContain('Authored Activity');
    expect(next).not.toContain('Approved');
  });
  it.each(['record','choices','comparison','terms','sequence'] as const)('preserves %s authored text through every screen state', kind => {
    const plan: TeachingVisual = { kind, steps };
    for (let index = 0; index < steps.length; index++) {
      const state = teachingPresentation(plan, index * 10 + 5, 40);
      const markup = renderToStaticMarkup(<BlueprintTeachingGraphic plan={plan} seconds={index * 10 + 5} duration={40} color="#123456" />);
      expect(state.activeIndex).toBe(index);
      expect(markup).toContain(`data-teaching-kind="${kind}"`);
      for (const row of state.rows) { expect(markup).toContain(row.label); expect(markup).toContain(row.value); }
      expect(state.rows.length).toBeLessThanOrEqual(2);
    }
  });
  it('checks retained record fields as well as the active field', () => {
    expect(teachingPresentation({kind:'record',steps},15,40).expectedText).toBe('Date Authored Date Activity Authored Activity');
  });
  it('rejects unusable timing', () => {
    expect(() => teachingPresentation({kind:'record',steps},0,0)).toThrow('TIMING_REQUIRED');
  });
});
