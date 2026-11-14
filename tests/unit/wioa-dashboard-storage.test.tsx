import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadWioaDashboard } from '@/lib/compliance/wioa-dashboard';
import WIOAComplianceDashboard from '@/components/admin/WIOAComplianceDashboard';

afterEach(cleanup);
function database(fail = false) {
  const calls: Array<{ table: string; columns?: string; filter?: string }> = [];
  const columns: Record<string, string[]> = {
    wioa_participants: ['id', 'is_veteran', 'is_dislocated_worker', 'is_low_income', 'is_youth'],
    wioa_compliance_reports: ['report_type', 'due_date', 'status'],
    compliance_alerts: ['id', 'alert_type', 'severity', 'message', 'description', 'resolved', 'created_at'],
  };
  const db = { from(table: string) {
    const call = { table } as (typeof calls)[number]; calls.push(call);
    const builder = {
      select(value: string) { call.columns = value; for (const column of value.split(',')) expect(columns[table]).toContain(column.trim()); return builder; },
      eq(column: string) { expect(columns[table]).toContain(column); call.filter = column; return builder; },
      order(column: string) { expect(columns[table]).toContain(column); return builder; },
      limit() { return builder; },
      then(resolve: (value: unknown) => unknown) {
        return Promise.resolve(resolve({
          error: fail ? { message: 'unavailable' } : null,
          count: call.filter ? 25 : 1200,
          data: table === 'wioa_compliance_reports' ? [{ report_type: 'quarterly', due_date: null, status: 'draft' }] : [],
        }));
      },
    }; return builder;
  } };
  return { db: db as unknown as Parameters<typeof loadWioaDashboard>[0], calls };
}

it('queries actual WIOA columns and returns exact counts beyond the former 500-row limit', async () => {
  const { db, calls } = database();
  const result = await loadWioaDashboard(db);
  expect(result.participants).toMatchObject({ total: 1200, youth: 25, placements: null, completions: null });
  expect(calls).toContainEqual(expect.objectContaining({ table: 'wioa_participants', filter: 'is_youth' }));
  expect(result.reports[0]).not.toHaveProperty('submissionMethod');
});

it('rejects a failed query rather than presenting zero participants or empty reports as success', async () => {
  await expect(loadWioaDashboard(database(true).db)).rejects.toThrow('WIOA_DASHBOARD_UNAVAILABLE');
});

it('shows unavailable outcome rates and missing due dates honestly', async () => {
  render(<WIOAComplianceDashboard {...await loadWioaDashboard(database().db)} />);
  expect(screen.getAllByText('Unavailable')).toHaveLength(2);
  expect(screen.getByText('1,200')).toBeInTheDocument();
  expect(screen.getByText('Due date not recorded')).toBeInTheDocument();
  expect(screen.queryByText('0%')).not.toBeInTheDocument();
});
