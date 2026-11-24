import { describe, expect, it } from 'vitest';
import { isSyntheticQaEnrollment, syntheticQaProfileIds } from '@/lib/enrollment/qa-report-classification';

const row = (id: string, payment_status: string | null, funding_source: string | null) => ({
  user_id: id, student_id: id, payment_status, funding_source,
});

describe('synthetic enrollment reporting boundaries', () => {
  it('recognizes only explicit QA markers', () => {
    expect(isSyntheticQaEnrollment(row('qa1', 'qa_test', 'SELF_PAY'))).toBe(true);
    expect(isSyntheticQaEnrollment(row('qa2', null, 'qa-e2e'))).toBe(true);
    expect(isSyntheticQaEnrollment(row('real', 'paid', 'SELF_PAY'))).toBe(false);
    expect(isSyntheticQaEnrollment(row('unknown', null, null))).toBe(false);
  });

  it('excludes exclusively QA profiles without mutating or changing access rights', () => {
    const rows = [
      row('qa1', 'qa_test', 'SELF_PAY'),
      row('qa2', null, 'qa-e2e'),
      row('mixed', null, 'qa-e2e'),
      row('mixed', 'paid', 'SELF_PAY'),
      row('real', 'paid', 'SELF_PAY'),
    ];
    const original = JSON.stringify(rows);
    expect([...syntheticQaProfileIds(rows)].sort()).toEqual(['qa1', 'qa2']);
    expect(JSON.stringify(rows)).toBe(original);
  });

  it('treats missing and unmapped enrollment evidence as non-QA', () => {
    expect(syntheticQaProfileIds([]).size).toBe(0);
    expect(syntheticQaProfileIds([{ user_id: null, student_id: null, payment_status: 'qa_test', funding_source: null }]).size).toBe(0);
    expect(syntheticQaProfileIds([row('learner', null, null)]).size).toBe(0);
  });
});
