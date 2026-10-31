import { expect, it } from 'vitest';
import { trainingHoursDisplay } from '@/lib/program-holder/training-hours-display';
it('preserves real totals and confines the 48-hour target to the EPA pathway', () => {
  expect(trainingHoursDisplay({ total_hours_completed: 75, program_slug: 'hvac-technician' })).toBe(
    '75 of 48 recorded',
  );
  expect(
    trainingHoursDisplay({ total_hours_completed: 300, program_slug: 'barber-apprenticeship' }),
  ).toBe('300 hours recorded');
  expect(trainingHoursDisplay({ total_hours_completed: 0 })).toBe('0 hours recorded');
  expect(trainingHoursDisplay({ total_hours_completed: null })).toBe('Not recorded');
});
