import { describe, expect, it } from 'vitest';
import { formatTheoryStartDate } from '../../lib/apprenticeship/theory-start-date';

describe('shared apprentice and Host Shop theory start date', () => {
  it('uses the actual assigned date instead of the old fixed intake date', () => {
    expect(formatTheoryStartDate('2026-09-21')).toBe('Monday, September 21, 2026');
    expect(formatTheoryStartDate('2026-10-26')).toBe('Monday, October 26, 2026');
    expect(formatTheoryStartDate('2027-01-05T00:00:00Z')).toBe('Tuesday, January 5, 2027');
  });
  it('supports valid leap days without normalizing nonexistent dates', () => {
    expect(formatTheoryStartDate('2028-02-29')).toBe('Tuesday, February 29, 2028');
    expect(formatTheoryStartDate('2026-02-29')).toBeNull();
    expect(formatTheoryStartDate('2026-02-30')).toBeNull();
  });
  it.each([undefined, null, '', 'invalid', '2026-13-01', '2026-1-01', 20261026])('does not invent a start date for %s', value => {
    expect(formatTheoryStartDate(value)).toBeNull();
  });
});
