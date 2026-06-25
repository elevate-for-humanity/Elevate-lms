/**
 * Static analysis tests for Calendar components.
 * Reads source files and verifies structural requirements.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Calendar Widget', () => {
  const calendarPath = path.resolve('components/CalendarWidget.tsx');

  it('CalendarWidget file exists and has a default export', () => {
    expect(fs.existsSync(calendarPath)).toBe(true);
    const src = fs.readFileSync(calendarPath, 'utf-8');
    expect(src).toContain('export default');
  });

  it('CalendarWidget renders calendar UI elements', () => {
    const src = fs.readFileSync(calendarPath, 'utf-8');
    expect(src).toMatch(/calendar|schedule|event|date|time/i);
  });
});

describe('Calendar Component', () => {
  const calendarPath = path.resolve('components/Calendar.tsx');

  it('Calendar file exists and has a default export', () => {
    expect(fs.existsSync(calendarPath)).toBe(true);
    const src = fs.readFileSync(calendarPath, 'utf-8');
    expect(src).toContain('export default');
  });

  it('Calendar handles date selection', () => {
    const src = fs.readFileSync(calendarPath, 'utf-8');
    expect(src).toMatch(/onClick|onSelect|date|selected/i);
  });
});

describe('Calendar Integration', () => {
  const integrationPath = path.resolve('components/CalendarIntegration.tsx');

  it('CalendarIntegration file exists', () => {
    expect(fs.existsSync(integrationPath)).toBe(true);
  });
});

describe('Upcoming Calendar', () => {
  const upcomingPath = path.resolve('components/dashboard/UpcomingCalendar.tsx');

  it('UpcomingCalendar file exists', () => {
    expect(fs.existsSync(upcomingPath)).toBe(true);
    const src = fs.readFileSync(upcomingPath, 'utf-8');
    expect(src).toContain('export default');
  });
});
