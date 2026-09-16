export const DEFAULT_TIMECLOCK_TIME_ZONE = 'America/Indiana/Indianapolis';

/**
 * Return the calendar date used by the apprenticeship timeclock.
 *
 * Server processes run in UTC, which previously rolled the work date forward
 * several hours before midnight in Indiana. Keeping this calculation in one
 * helper makes the context and mutation endpoints agree at every rollover.
 */
export function getTimeclockWorkDate(
  now: Date = new Date(),
  timeZone: string = process.env.TIMECLOCK_TIME_ZONE || DEFAULT_TIMECLOCK_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getTimeclockWeekEnding(workDate: string): string {
  const date = new Date(`${workDate}T12:00:00Z`);
  const daysToSaturday = (6 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + daysToSaturday);
  return date.toISOString().slice(0, 10);
}
