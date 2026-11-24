import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKFILL_TIME_ZONE,
  computeBackfillEntry,
  getWeekEndingSaturday,
  normalizePhoneDigits,
} from '../../lib/admin/hours-backfill.mjs';

// Hours exactly as reported by the students (2026-11-23). No lunch reported
// for any shift, so none is deducted. November dates are EST (UTC-05:00).

test('Reese Nov 19: 9:55 AM-5:35 PM is 7.67h, week ending Sat Nov 21', () => {
  const row = computeBackfillEntry({ workDate: '2026-11-19', clockIn: '09:55', clockOut: '17:35' });
  assert.equal(row.hours_worked, 7.67);
  assert.equal(row.week_ending, '2026-11-21');
  assert.equal(row.clock_in_at, '2026-11-19T09:55:00-05:00');
  assert.equal(row.clock_out_at, '2026-11-19T17:35:00-05:00');
});

test('Reese Nov 21: 9:00 AM-5:30 PM is 8.5h, week ending Sat Nov 21', () => {
  const row = computeBackfillEntry({ workDate: '2026-11-21', clockIn: '09:00', clockOut: '17:30' });
  assert.equal(row.hours_worked, 8.5);
  assert.equal(row.week_ending, '2026-11-21');
});

test('Reese Nov 23: 9:00 AM-3:20 PM is 6.33h, week ending Sat Nov 28', () => {
  const row = computeBackfillEntry({ workDate: '2026-11-23', clockIn: '09:00', clockOut: '15:20' });
  assert.equal(row.hours_worked, 6.33);
  assert.equal(row.week_ending, '2026-11-28');
});

test('Logan Nov 20 and Nov 23: 9:00 AM-6:00 PM is 9h each', () => {
  const fri = computeBackfillEntry({ workDate: '2026-11-20', clockIn: '09:00', clockOut: '18:00' });
  const mon = computeBackfillEntry({ workDate: '2026-11-23', clockIn: '09:00', clockOut: '18:00' });
  assert.equal(fri.hours_worked, 9);
  assert.equal(fri.week_ending, '2026-11-21');
  assert.equal(mon.hours_worked, 9);
  assert.equal(mon.week_ending, '2026-11-28');
});

test('Reese total is 22.5h; Logan total is 18h', () => {
  const reese = [
    computeBackfillEntry({ workDate: '2026-11-19', clockIn: '09:55', clockOut: '17:35' }),
    computeBackfillEntry({ workDate: '2026-11-21', clockIn: '09:00', clockOut: '17:30' }),
    computeBackfillEntry({ workDate: '2026-11-23', clockIn: '09:00', clockOut: '15:20' }),
  ];
  const reeseTotal = reese.reduce((sum, row) => sum + row.hours_worked, 0);
  assert.equal(Math.round(reeseTotal * 100) / 100, 22.5);
  const logan = [
    computeBackfillEntry({ workDate: '2026-11-20', clockIn: '09:00', clockOut: '18:00' }),
    computeBackfillEntry({ workDate: '2026-11-23', clockIn: '09:00', clockOut: '18:00' }),
  ];
  assert.equal(logan.reduce((sum, row) => sum + row.hours_worked, 0), 18);
  assert.equal(BACKFILL_TIME_ZONE, 'America/Indiana/Indianapolis');
});

test('week ending is the Saturday of the same week', () => {
  assert.equal(getWeekEndingSaturday('2026-11-19'), '2026-11-21'); // Thu -> Sat
  assert.equal(getWeekEndingSaturday('2026-11-21'), '2026-11-21'); // Sat -> Sat
  assert.equal(getWeekEndingSaturday('2026-11-23'), '2026-11-28'); // Mon -> Sat
  assert.equal(getWeekEndingSaturday('2026-11-22'), '2026-11-28'); // Sun -> Sat
});

test('phone normalization strips formatting and a US country code', () => {
  assert.equal(normalizePhoneDigits('(269) 479-5318'), '2694795318');
  assert.equal(normalizePhoneDigits('+1 (765) 476-9571'), '7654769571');
  assert.equal(normalizePhoneDigits('7654769571'), '7654769571');
});

test('invalid shifts throw instead of recording bad hours', () => {
  assert.throws(() => computeBackfillEntry({ workDate: '2026-11-23', clockIn: '15:20', clockOut: '09:00' }), /must be after clock_in/);
  assert.throws(() => computeBackfillEntry({ workDate: '2026-11-23', clockIn: '09:00', clockOut: '09:00' }), /must be after clock_in/);
  assert.throws(() => computeBackfillEntry({ workDate: '2026-13-01', clockIn: '09:00', clockOut: '17:00' }), /Invalid work_date/);
  assert.throws(() => computeBackfillEntry({ workDate: '2026-11-23', clockIn: '9:00', clockOut: '17:00' }), /Invalid clock_in/);
});
