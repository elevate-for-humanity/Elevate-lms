import { describe, expect, it } from 'vitest';
import { studentMatchesSearch } from '@/lib/admin/student-search';
describe('Admin student search', () => {
  it('matches full names, separate names, email and phone without case sensitivity', () => {
    const record = {
      first_name: 'River',
      last_name: 'Cole',
      email: 'river@example.test',
      phone: '555-0104',
    };
    expect(studentMatchesSearch(record, ' RIVER COLE ')).toBe(true);
    expect(studentMatchesSearch(record, 'RIVER@')).toBe(true);
    expect(studentMatchesSearch(record, '0104')).toBe(true);
    expect(studentMatchesSearch({ full_name: 'River Cole' }, 'cole')).toBe(true);
  });
  it('returns no matches for unrelated or missing optional data', () => {
    expect(studentMatchesSearch({ full_name: 'River Cole' }, 'audit-no-match')).toBe(false);
    expect(studentMatchesSearch({ email: null }, 'river')).toBe(false);
    expect(studentMatchesSearch({ full_name: 'River Cole' }, 'River,email.eq.x')).toBe(false);
  });
  it('keeps the operational directory unfiltered when search is empty', () => {
    expect(studentMatchesSearch({}, '  ')).toBe(true);
  });
});
