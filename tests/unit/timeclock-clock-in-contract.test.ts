import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync('apps/lms/app/api/timeclock/action/route.ts', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20260915121242_fix_timeclock_daily_clockins.sql',
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
  });
});
