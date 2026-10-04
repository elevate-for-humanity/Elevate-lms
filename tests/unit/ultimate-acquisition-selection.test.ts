import { describe, expect, it } from 'vitest';
import { selectApprovedAcquisitionMatches } from '@/lib/ultimate-course-builder/instructional/acquisition-selection';

describe('licensed acquisition candidate selection', () => {
  it('does not starve scene coverage behind a sixteen-match ranking cutoff', () => {
    const matches = Array.from({ length: 34 }, (_, i) => ({
      id: `match-${i}`, lesson_id: 'lesson', entitlement_id: `item-${i}`, match_score: 100 - i,
    }));
    expect(selectApprovedAcquisitionMatches(matches)).toHaveLength(34);
    expect(selectApprovedAcquisitionMatches(matches)).toContainEqual(matches[33]);
  });
  it('attaches each approved lesson/item once while retaining other lessons', () => {
    const matches = [
      { id: 'low', lesson_id: 'one', entitlement_id: 'item', match_score: 1 },
      { id: 'high', lesson_id: 'one', entitlement_id: 'item', match_score: 2 },
      { id: 'other', lesson_id: 'two', entitlement_id: 'item', match_score: 1 },
    ];
    expect(selectApprovedAcquisitionMatches(matches).map(m => m.id)).toEqual(['high', 'other']);
  });
  it('keeps deterministic selection without changing match status or source evidence', () => {
    const a = { id: 'a', lesson_id: 'one', entitlement_id: 'item', match_score: 1 };
    const b = { ...a, id: 'b' };
    expect(selectApprovedAcquisitionMatches([b, a])).toEqual([a]);
    expect(selectApprovedAcquisitionMatches([a, b])).toEqual([a]);
    expect(a).not.toHaveProperty('status');
  });
});
