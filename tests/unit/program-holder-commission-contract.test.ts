import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Program Holder student-scoped commission contract', () => {
  const migration = read('supabase/migrations/20260913090000_program_holder_conversion_commissions.sql');
  const callLog = read('apps/lms/app/api/program-holder/call-log/route.ts');
  const workspace = read('lib/program-holder/workspace.ts');
  const callList = read('components/program-holder/CallListPanel.tsx');

  it('does not make routed applicants commissionable', () => {
    expect(migration).toContain("qualification_source text not null default 'holder_enrollment'");
    expect(callLog).toContain("if (outcome === 'enrolled')");
    expect(callLog).not.toContain("outcome === 'interested' ? 3000");
  });

  it('moves converted participants into the enrolled roster and keeps call work visible', () => {
    expect(callLog).toContain("status: outcome === 'enrolled' ? 'enrolled'");
    expect(workspace).toContain(".eq('status', 'enrolled')");
    expect(workspace).toContain('convertedStudents');
    expect(callList).toContain('Call Notes');
    expect(callList).toContain('next_follow_up');
  });

  it('provides one-tap mobile call and text actions', () => {
    expect(callList).toContain('href={`tel:${applicant.applicant_phone}`}');
    expect(callList).toContain('href={`sms:${applicant.applicant_phone}`}');
  });

  it('requires documented setup before activating the 30 percent agreement', () => {
    expect(callLog).toContain("outcome === 'enrolled' && (!notes || !workStartDate)");
    expect(callLog).toContain('commission_rate_bps: 3000');
    expect(callLog).toContain("qualification_source: 'holder_enrollment'");
  });

  it('provides idempotent payment and reversal records', () => {
    expect(migration).toContain('unique (provider, provider_event_id, payment_kind)');
    expect(migration).toContain("payment_kind in ('deposit','weekly','refund','chargeback')");
    expect(migration).toContain('reverses_ledger_id');
  });

  it('limits holder reads to their own commission records', () => {
    expect(migration.match(/public\.current_program_holder_id\(\)/g)?.length).toBe(2);
    expect(callLog).toContain(".eq('program_holder_id', ctx.holderId)");
  });
});
