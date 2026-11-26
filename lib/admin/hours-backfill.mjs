// Admin hours backfill — pure helpers (no imports, node-testable).
//
// The timeclock writes progress_entries when a student clocks in/out. When a
// student could not sign in at all (login bug), there is nothing to clock
// with, so an admin records the student-reported hours after the fact.
// These helpers compute the exact row values; the API route in
// apps/admin/app/api/admin/hours/backfill/route.ts does the lookups and the
// insert. Times are wall-clock times in the shop timezone
// (America/Indiana/Indianapolis); November dates are EST (UTC-05:00).

export const BACKFILL_TIME_ZONE = 'America/Indiana/Indianapolis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Strip everything but digits; a leading US country code is dropped. */
export function normalizePhoneDigits(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function parseWorkDate(workDate) {
  if (!DATE_RE.test(workDate)) throw new Error(`Invalid work_date: ${workDate}`);
  const date = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== workDate) {
    throw new Error(`Invalid work_date: ${workDate}`);
  }
  return date;
}

function parseClockTime(value, label) {
  const match = TIME_RE.exec(String(value ?? '').trim());
  if (!match) throw new Error(`Invalid ${label}: ${value} (expected HH:MM)`);
  return { hours: Number(match[1]), minutes: Number(match[2]), total: Number(match[1]) * 60 + Number(match[2]) };
}

/** Saturday ending the week that contains workDate. Mirrors getTimeclockWeekEnding in lib/timeclock/work-date.ts. */
export function getWeekEndingSaturday(workDate) {
  const date = parseWorkDate(workDate);
  const daysToSaturday = (6 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + daysToSaturday);
  return date.toISOString().slice(0, 10);
}

/** Numeric UTC offset ("-05:00") for a wall-clock time in the given zone. */
export function getZoneOffsetString(timeZone, workDate, clockTime) {
  const [year, month, day] = workDate.split('-').map(Number);
  const { hours, minutes } = parseClockTime(clockTime, 'clock time');
  const probe = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(probe);
  const tzName = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(tzName);
  if (!match) throw new Error(`Cannot resolve UTC offset for ${timeZone} on ${workDate}`);
  return `${match[1]}${match[2]}:${match[3]}`;
}

/**
 * Compute one progress_entries row from a student-reported shift.
 * Returns { work_date, week_ending, hours_worked, clock_in_at, clock_out_at }.
 * Throws on a bad date, bad time, or a clock-out that is not after clock-in.
 * No lunch is deducted: none was reported for these shifts.
 */
export function computeBackfillEntry({ workDate, clockIn, clockOut, timeZone = BACKFILL_TIME_ZONE }) {
  parseWorkDate(workDate);
  const start = parseClockTime(clockIn, 'clock_in');
  const end = parseClockTime(clockOut, 'clock_out');
  if (end.total <= start.total) {
    throw new Error(`clock_out (${clockOut}) must be after clock_in (${clockIn}) on ${workDate}`);
  }
  const hoursWorked = Math.round(((end.total - start.total) / 60) * 100) / 100;
  if (hoursWorked > 24) throw new Error(`Shift on ${workDate} is longer than 24 hours`);
  const offset = getZoneOffsetString(timeZone, workDate, clockIn);
  return {
    work_date: workDate,
    week_ending: getWeekEndingSaturday(workDate),
    hours_worked: hoursWorked,
    clock_in_at: `${workDate}T${clockIn}:00${offset}`,
    clock_out_at: `${workDate}T${clockOut}:00${offset}`,
  };
}
