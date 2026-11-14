import {describe,expect,it} from 'vitest';
import {enrollmentStatusDisplay} from '@/lib/programs/enrollment-status-display';
import {readFileSync} from 'node:fs';
describe('enrollment status presentation', () => {
  it.each(['pending','paid','approved','cancelled','withdrawn'])('does not claim %s is confirmed', (status) => {
    expect(enrollmentStatusDisplay(status).confirmed).toBe(false);
  });
  it.each(['active','confirmed','completed'])('reports the recorded %s state', (status) => {
    expect(enrollmentStatusDisplay(status).confirmed).toBe(true);
  });
  it('does not manufacture a start date from enrollment time', () => {
    expect(enrollmentStatusDisplay('paid').startDateLabel).toBe('Admissions will confirm your start date');
    expect(enrollmentStatusDisplay('active','not-a-date').startDateLabel).toBe('Admissions will confirm your start date');
  });
  it('reports a valid scheduled date', () => {
    expect(enrollmentStatusDisplay('active','2026-11-02T15:00:00Z').startDateLabel).toContain('November 2, 2026');
  });
  it('keeps the page read-only and scoped to the requested program', () => {
    const source=readFileSync('components/programs/beauty/EnrollmentStatusPage.tsx','utf8');
    expect(source).not.toContain('.update(');
    expect(source).toContain(".eq('program_id',program.id)");
    expect(source).toContain(".eq('user_id',user.id)");
  });
});
