import { readFileSync } from 'node:fs';

const page = readFileSync('apps/admin/app/staff-portal/attendance/page.tsx', 'utf8');
const exportPage = readFileSync('apps/admin/app/staff-portal/attendance/export/page.tsx', 'utf8');
const exportRoute = readFileSync('apps/admin/app/api/staff/attendance/export/route.ts', 'utf8');

describe('Admin attendance contract', () => {
  it('reads canonical attendance_hours columns', () => {
    expect(page).toContain('hours_logged');
    expect(page).toContain('verified');
    expect(page).not.toContain('hours_worked');
    expect(page).not.toContain('record.status');
    expect(page).not.toContain('record.apprentices');
  });

  it('exports live CSV data through a protected route', () => {
    expect(exportPage).toContain('action="/api/staff/attendance/export"');
    expect(exportRoute).toContain('requireStaffPortalApi');
    expect(exportRoute).toContain("from('attendance_hours')");
  });

  it('does not show fabricated export history or sizes', () => {
    expect(exportPage).not.toContain('attendance_jan_2024.csv');
    expect(exportPage).not.toContain('monthly_report_dec.xlsx');
    expect(exportPage).not.toContain('~50 KB');
  });
});
