import { expect, it } from 'vitest';
import { summarizeRecordedActivity } from '@/lib/learner/recorded-activity';
const now = new Date('2026-10-27T12:00:00Z');
it('sums every recorded activity in a day and converts seconds to minutes and hours once', () => {
  const result = summarizeRecordedActivity([{ activity_date: '2026-10-27', seconds_watched: 1800 }, { activity_date: '2026-10-27', seconds_watched: 1800 }], now);
  expect(result.last7Days.at(-1)).toEqual({ date: '2026-10-27', minutes: 60 });
  expect(result.averageTimePerWeekHours).toBe(1);
  expect(result.activeStreakDays).toBe(1);
});
it('uses consecutive UTC activity dates and ignores invalid duration values', () => {
  const result = summarizeRecordedActivity([{ activity_date: '2026-10-26', seconds_watched: -100 }, { activity_date: '2026-10-25', seconds_watched: 60 }, { activity_date: null, created_at: '2026-10-24T23:00:00Z', seconds_watched: NaN }], now);
  expect(result.activeStreakDays).toBe(3);
  expect(result.averageTimePerWeekHours).toBe(1 / 60);
});
it('does not invent a streak or time when no activity was recorded', () => {
  expect(summarizeRecordedActivity([], now)).toMatchObject({ activeStreakDays: 0, averageTimePerWeekHours: 0 });
});
