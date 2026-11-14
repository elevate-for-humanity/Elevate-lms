import { describe, it, expect } from 'vitest';
import { validateTheoryAvailability } from '../../lib/apprenticeship/theory-scheduling';
describe('learner theory availability', () => {
  it('accepts downtime that fits the assigned weekly budget', () => {
    expect(
      validateTheoryAvailability(
        { days: [4, 1, 3, 2], startTime: '18:00', endTime: '18:45' },
        180,
        600,
      ),
    ).toEqual({ days: [1, 2, 3, 4], startTime: '18:00', endTime: '18:45', weeklyMinutes: 180 });
  });
  it('rejects duplicate/invalid days, impossible times, short blocks and cap bypasses', () => {
    for (const value of [
      { days: [1, 1], startTime: '18:00', endTime: '20:00' },
      { days: [0], startTime: '18:00', endTime: '21:00' },
      { days: [1], startTime: '24:00', endTime: '25:00' },
      { days: [1], startTime: '20:00', endTime: '18:00' },
      { days: [1], startTime: '18:00', endTime: '18:45' },
      { days: [1, 2, 3, 4], startTime: '00:00', endTime: '12:00' },
    ])
      expect(() => validateTheoryAvailability(value, 180, 1200)).toThrow();
  });
});
