/**
 * Static contract tests for the canonical learner calendar.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Calendar Widget', () => {
  const calendarPath = path.resolve('components/CalendarWidget.tsx');

  it('exists and is interactive', () => {
    expect(fs.existsSync(calendarPath)).toBe(true);
    const src = fs.readFileSync(calendarPath, 'utf-8');
    expect(src).toContain('export function CalendarWidget');
    expect(src).toContain('/api/calendar/events');
    expect(src).toMatch(/setCurrentDate|setSelectedDate/);
  });
});

describe('Learner calendar page', () => {
  const pagePath = path.resolve('apps/lms/app/lms/(app)/calendar/page.tsx');

  it('uses canonical course enrollment and one calendar UI', () => {
    const src = fs.readFileSync(pagePath, 'utf-8');
    expect(src).toContain("from('course_enrollments')");
    expect(src).toContain(".eq('student_id', user.id)");
    expect(src).toContain('<CalendarWidget userId={user.id} />');
    expect(src).not.toContain('CalendarIntegration');
    expect(src).not.toContain("from('program_enrollments')");
  });
});

describe('Calendar events API', () => {
  const apiPath = path.resolve('apps/lms/app/api/calendar/events/route.ts');

  it('exists and scopes data to the authenticated learner', () => {
    expect(fs.existsSync(apiPath)).toBe(true);
    const src = fs.readFileSync(apiPath, 'utf-8');
    expect(src).toContain("from('calendar_events')");
    expect(src).toContain('requestedUserId !== user.id');
    expect(src).toContain('Authentication required');
  });
});

describe('Upcoming Calendar', () => {
  const upcomingPath = path.resolve('components/dashboard/UpcomingCalendar.tsx');

  it('exists for dashboard summaries', () => {
    expect(fs.existsSync(upcomingPath)).toBe(true);
    const src = fs.readFileSync(upcomingPath, 'utf-8');
    expect(src).toContain('export default');
  });
});
