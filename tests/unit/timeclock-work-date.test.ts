import { describe, expect, it } from 'vitest';
import { getTimeclockWeekEnding, getTimeclockWorkDate } from '../../lib/timeclock/work-date';

describe('timeclock work-date rollover', () => {
  it('does not roll Indiana shifts into tomorrow at UTC midnight', () => {
    const instant = new Date('2026-09-17T01:30:00.000Z');
    expect(getTimeclockWorkDate(instant, 'America/Indiana/Indianapolis')).toBe('2026-09-16');
  });

  it('rolls after local midnight', () => {
    const instant = new Date('2026-09-17T04:30:00.000Z');
    expect(getTimeclockWorkDate(instant, 'America/Indiana/Indianapolis')).toBe('2026-09-17');
  });

  it('uses the same Saturday week ending for every day in a work week', () => {
    expect(getTimeclockWeekEnding('2026-09-14')).toBe('2026-09-19');
    expect(getTimeclockWeekEnding('2026-09-19')).toBe('2026-09-19');
  });
});
