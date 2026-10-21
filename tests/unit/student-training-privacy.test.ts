import { describe, expect, it } from 'vitest';
import { completionAlert, holderTrainingRecord } from '@/lib/program-holder/student-training';

describe('holder training disclosure', () => {
  it('never returns confidential financial fields, including future columns', () => {
    const record = holderTrainingRecord({ id: 'enrollment', full_name: 'Student', expected_end_date: '2026-11-01',
      voucher_id: 'secret', amount_paid_cents: 500000, funding_verified: true, payment_status: 'paid',
      expected_payout_cents: 10000, new_financial_column: 'private' });
    expect(record).toEqual({ id: 'enrollment', full_name: 'Student', expected_end_date: '2026-11-01' });
  });
  it.each([
    ['2026-11-19', 'Completion due within 30 days'],
    ['2026-11-03', 'Completion due within 14 days'],
    ['2026-10-27', 'Completion due within 7 days'],
    ['2026-10-20', 'Completion due today'],
    ['2026-10-19', 'Completion overdue — confirm progress'],
  ])('reports planned completion %s without certifying the student', (expected_end_date, alert) => {
    const row = { expected_end_date, status: 'active' };
    expect(completionAlert(row, '2026-10-20')).toBe(alert);
    expect(row.status).toBe('active');
  });
  it('requires a documented actual date even for a completed enrollment', () => {
    expect(completionAlert({ status: 'completed', expected_end_date: '2026-10-01' }, '2026-10-20')).toContain('documentation');
    expect(completionAlert({ status: 'completed', completion_date: '2026-10-01' }, '2026-10-20')).toBeNull();
  });
  it('does not guess a missing expected date', () => expect(completionAlert({}, '2026-10-20')).toContain('missing'));
});
