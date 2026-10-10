import { describe, expect, it } from 'vitest';
import {
  hydrateAdminHours,
  applyLedgerReview,
  summarizeHoursLedger,
  type HoursLedgerEntry,
  summarizeAdminHours,
  formatHoursDate,
  type ProgressHoursEntry,
  type HoursApprentice,
  type HoursProgram,
} from '@/lib/apprenticeship/admin-hours-model';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';

const program: HoursProgram = {
  id: 'program-id',
  slug: 'hair-apprenticeship',
  name: 'Hair Apprenticeship',
  title: null,
  required_hours: 2000,
  total_hours: null,
};
const apprentice: HoursApprentice = {
  id: 'apprentice-id',
  user_id: 'user-id',
  program_id: program.id,
  total_hours_required: 1800,
  status: 'active',
  start_date: null,
  enrollment_date: null,
};
const profile = { id: 'user-id', full_name: 'Example Student', email: 'student@example.test' };
const entry = (overrides: Partial<ProgressHoursEntry> = {}): ProgressHoursEntry => ({
  id: 'entry-1',
  apprentice_id: 'apprentice-id',
  program_id: 'program-id',
  status: 'submitted',
  work_date: '2026-10-06',
  week_ending: '2026-10-11',
  hours_worked: '7.25',
  notes: null,
  tasks_completed: null,
  clock_in_at: null,
  clock_out_at: null,
  verified_by: null,
  verified_at: null,
  ...overrides,
});
const hydrate = (rows: ProgressHoursEntry[]) =>
  hydrateAdminHours(rows, [apprentice], [program], [profile]);

describe('admin hours identities and totals', () => {
  it('merges legacy user/uppercase slug and current apprentice/UUID records without mislabeling the program', () => {
    const rows = hydrate([
      entry({ status: 'verified' }),
      entry({
        id: 'legacy',
        apprentice_id: 'user-id',
        program_id: 'HAIR-APPRENTICESHIP',
        work_date: '2026-10-05',
        hours_worked: '10.10',
        status: 'verified',
      }),
    ]);
    const summaries = summarizeAdminHours(rows);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      name: 'Example Student',
      program_title: 'Hair Apprenticeship',
      approved_hours: 17.35,
      required_hours: 1800,
    });
  });
  it('separates programs for the same student', () => {
    const other = { ...program, id: 'other-program', slug: 'other', name: 'Other program' };
    const rows = hydrateAdminHours(
      [entry(), entry({ id: 'other', program_id: other.id })],
      [apprentice],
      [program, other],
      [profile],
    );
    expect(summarizeAdminHours(rows)).toHaveLength(2);
    expect(rows.every((row) => row.approval_blocker === null)).toBe(true);
  });
  it('does not invent program names or requirements for unlinked records', () => {
    const [row] = hydrate([entry({ program_id: 'unknown' })]);
    expect(row).toMatchObject({ program_title: 'Unlinked program', required_hours: null });
    expect(row.approval_blocker).toBeTruthy();
  });
  it('keeps drafts and disputes out of pending and approved totals', () => {
    const rows = hydrate([
      entry({ status: 'draft' }),
      entry({ id: 'disputed', status: 'disputed' }),
    ]);
    expect(summarizeAdminHours(rows)[0]).toMatchObject({ pending_hours: 0, approved_hours: 0 });
    expect(rows.every((row) => row.approval_blocker)).toBe(true);
  });
  it('blocks duplicate dates even across legacy IDs, canonical IDs, and verified history', () => {
    const rows = hydrate([
      entry(),
      entry({
        id: 'legacy',
        apprentice_id: 'user-id',
        program_id: 'HAIR-APPRENTICESHIP',
        status: 'verified',
      }),
    ]);
    expect(rows[0].approval_blocker).toContain('Multiple entries');
  });
  it('does not treat zero-hour abandoned shifts as conflicting completed entries', () => {
    const rows = hydrate([entry(), entry({ id: 'empty', hours_worked: 0 })]);
    expect(rows[0].approval_blocker).toBeNull();
    expect(rows[1].approval_blocker).toBe('No completed hours');
  });
  it('blocks an unfinished shift even if it has a nonzero amount', () => {
    expect(hydrate([entry({ clock_in_at: '2026-10-06T12:00:00Z' })])[0].approval_blocker).toContain(
      'not been clocked out',
    );
  });
  it('formats database work dates without a browser time zone shift', () => {
    expect(formatHoursDate('2026-10-06')).toBe('Oct 6, 2026');
  });
});

describe('complete queue loading', () => {
  it('loads records beyond the first database page', async () => {
    const all = Array.from({ length: 1001 }, (_, id) => ({ id }));
    const rows = await readHoursPages(async (from, to) => ({
      data: all.slice(from, to + 1),
      error: null,
    }));
    expect(rows).toHaveLength(1001);
    expect(rows.at(-1)).toEqual({ id: 1000 });
  });
  it('does not present a truncated result as success when a later page fails', async () => {
    await expect(
      readHoursPages(async (from) =>
        from
          ? { data: null, error: new Error('offline') }
          : { data: Array(500).fill({}), error: null },
      ),
    ).rejects.toThrow('offline');
  });
});

describe('ledger review and credit preservation', () => {
  const ledgerRow: HoursLedgerEntry = {
    id: 'ledger-1',
    user_id: 'user-id',
    program_slug: program.slug,
    progress_entry_id: null,
    legacy_source: null,
    legacy_id: null,
    status: 'approved',
    work_date: '2026-10-06',
    hours_claimed: 7.25,
    accepted_hours: 7.25,
    source_type: 'ojl',
  };
  it('does not add another credit when a standalone ledger entry exists for the same day', () => {
    const rows = hydrate([entry()]);
    applyLedgerReview(rows, [ledgerRow], [program]);
    expect(rows[0].approval_blocker).toContain('ledger entry');
  });
  it('allows syncing an existing ledger row linked to the same progress record', () => {
    const rows = hydrate([entry()]);
    applyLedgerReview(rows, [{ ...ledgerRow, progress_entry_id: rows[0].id }], [program]);
    expect(rows[0].approval_blocker).toBeNull();
  });
  it('preserves legacy credits and filters by program without double counting progress', () => {
    expect(
      summarizeHoursLedger(
        [
          ledgerRow,
          {
            ...ledgerRow,
            id: 'old-credit',
            accepted_hours: 663.48,
            source_type: 'in_state_barber_school',
          },
          { ...ledgerRow, id: 'other', program_slug: 'other', accepted_hours: 500 },
        ],
        'user-id',
        program.slug,
      ),
    ).toEqual({ approved: 670.73, pending: 0 });
  });
});
