/** Calendar months in UTC, matching date-only Postgres interval scheduling. */
export function addFollowUpMonths(date: Date, months: number): Date {
  if (!Number.isFinite(date.getTime()) || !Number.isInteger(months))
    throw new Error('Invalid follow-up date');
  const target = new Date(date);
  const day = target.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const monthEnd = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, monthEnd));
  return target;
}
export function scheduleFollowUps(exitDate: Date) {
  return { q2: addFollowUpMonths(exitDate, 6), q4: addFollowUpMonths(exitDate, 12) };
}
