import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync('apps/lms/app/api/timeclock/action/route.ts', 'utf8');
const contextRoute = readFileSync('apps/lms/app/api/timeclock/context/route.ts', 'utf8');
const timeclockPage = readFileSync('apps/lms/app/apprentice/timeclock/page.tsx', 'utf8');
const policy = readFileSync('lib/timeclock/policy.ts', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20260915121242_fix_timeclock_daily_clockins.sql',
  'utf8',
);
const dailyShiftMigration = readFileSync(
  'supabase/migrations/20260916193354_repair_timeclock_daily_shift_uniqueness.sql',
  'utf8',
);

describe('timeclock clock-in persistence contract', () => {
  it('resolves the program partner from the apprentice, site, or shop', () => {
    expect(route).toContain('apprentice.employer_id || site.partner_id');
    expect(route).toContain(".from('shops')");
    expect(route).toContain(".select('partner_id')");
  });

  it('provides every required value for an open progress entry', () => {
    expect(route).toContain('partner_id: resolvedPartnerId');
    expect(route).toContain('submitted_by: user.id');
    expect(route).toContain('hours_worked: 0');
  });

  it('removes the legacy weekly uniqueness rule', () => {
    expect(migration).toContain(
      'drop constraint if exists progress_entries_apprentice_id_partner_id_program_id_week_e_key',
    );
    expect(dailyShiftMigration).toContain(
      'drop index if exists public.progress_entries_unique_week',
    );
    expect(dailyShiftMigration).toContain('progress_entries_unique_daily_timeclock');
  });

  it('only treats a real current-day clock-in as an active shift', () => {
    expect(route).toContain(".eq('work_date', serverDate)");
    expect(route).toContain(".not('clock_in_at', 'is', null)");
    expect(contextRoute).toContain(".eq('work_date', workDate)");
    expect(contextRoute).toContain(".not('clock_in_at', 'is', null)");
  });

  it('reuses an existing current-day draft and makes retries idempotent', () => {
    expect(route).toContain(".eq('status', 'draft')");
    expect(route).toContain("update(clockInValues).eq('id', currentDraft.id)");
    expect(route).toContain('already_clocked_in: true');
  });

  it('shows and enforces the weekly apprenticeship time policy', () => {
    expect(policy).toContain('weeklyOjlMaxHours: 40');
    expect(policy).toContain('weeklyTheoryTargetHours: 3');
    expect(policy).toContain('weeklyTheoryMaxHours: 10');
    expect(policy).toContain('weeklyCombinedMaxHours: 50');
    expect(policy).toContain('outsideGeofenceGraceMinutes: 15');
    expect(route).toContain("code: 'WEEKLY_OJL_LIMIT_REACHED'");
    expect(contextRoute).toContain('weeklyTheoryVerifiedHours');
    expect(timeclockPage).toContain('Weekly hours and timeclock rules');
    expect(timeclockPage).toContain('Login alone does not earn theory credit');
  });
});
