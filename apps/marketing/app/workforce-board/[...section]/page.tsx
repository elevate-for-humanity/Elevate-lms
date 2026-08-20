import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

type Row = Record<string, unknown>;

function value(row: Row, keys: string[]) {
  for (const key of keys) {
    const v = row[key];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '—';
}

export default async function WorkforceBoardSectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  await requireRole(['workforce_board', 'admin', 'org_admin']);
  const supabase = await createClient();
  const route = section.join('/');

  let title = '';
  let description = '';
  let rows: Row[] = [];
  let columns: { label: string; keys: string[] }[] = [];

  if (route === 'participants') {
    title = 'Participants';
    description = 'Recent participant enrollments and current program status.';
    const { data } = await supabase
      .from('program_enrollments')
      .select('id, status, created_at, user_id, programs(title)')
      .order('created_at', { ascending: false })
      .limit(100);
    rows = (data || []) as unknown as Row[];
    columns = [
      { label: 'Enrollment', keys: ['id'] },
      { label: 'Status', keys: ['status'] },
      { label: 'Created', keys: ['created_at'] },
    ];
  } else if (route === 'training') {
    title = 'Training Programs';
    description = 'Active training programs available for workforce oversight.';
    const { data } = await supabase
      .from('programs')
      .select('id, title, status, created_at')
      .order('title', { ascending: true })
      .limit(100);
    rows = (data || []) as Row[];
    columns = [
      { label: 'Program', keys: ['title'] },
      { label: 'Status', keys: ['status'] },
      { label: 'Created', keys: ['created_at'] },
    ];
  } else if (route === 'supportive-services') {
    title = 'Supportive Services';
    description = 'Supportive-service requests and approval status.';
    const { data } = await supabase
      .from('supportive_services')
      .select('*')
      .order('request_date', { ascending: false })
      .limit(100);
    rows = (data || []) as Row[];
    columns = [
      { label: 'Service', keys: ['service_type', 'type', 'category'] },
      { label: 'Status', keys: ['status'] },
      { label: 'Requested', keys: ['requested_amount', 'amount'] },
      { label: 'Date', keys: ['request_date', 'created_at'] },
    ];
  } else if (route === 'follow-ups') {
    title = 'Follow-Up Outcomes';
    description = 'Employment outcomes used for post-program follow-up and retention review.';
    const { data } = await supabase
      .from('employment_outcomes')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(100);
    rows = (data || []) as Row[];
    columns = [
      { label: 'Status', keys: ['employment_status', 'status'] },
      { label: 'Employer', keys: ['employer_name', 'employer'] },
      { label: 'Wage', keys: ['hourly_wage', 'wage'] },
      { label: 'Start Date', keys: ['start_date', 'created_at'] },
    ];
  } else if (route === 'reports' || route === 'reports/performance') {
    title = route === 'reports/performance' ? 'Performance Report' : 'Workforce Reports';
    description = 'Live enrollment, completion, placement, and wage indicators from platform records.';
    const [enrollments, completions, outcomes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('employment_outcomes').select('employment_status, hourly_wage').limit(1000),
    ]);
    const outcomeRows = outcomes.data || [];
    const employed = outcomeRows.filter((item: any) => item.employment_status === 'employed').length;
    const wages = outcomeRows.map((item: any) => Number(item.hourly_wage || 0)).filter((n) => n > 0);
    const averageWage = wages.length ? wages.reduce((a, b) => a + b, 0) / wages.length : 0;
    const total = enrollments.count || 0;
    const completed = completions.count || 0;
    rows = [
      { metric: 'Total enrollments', result: total },
      { metric: 'Completed enrollments', result: completed },
      { metric: 'Completion rate', result: total ? `${Math.round((completed / total) * 100)}%` : '0%' },
      { metric: 'Employment records marked employed', result: employed },
      { metric: 'Average recorded hourly wage', result: averageWage ? `$${averageWage.toFixed(2)}` : '—' },
    ];
    columns = [
      { label: 'Metric', keys: ['metric'] },
      { label: 'Result', keys: ['result'] },
    ];
  } else {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/workforce-board/dashboard" className="text-sm font-semibold text-blue-700">← Workforce Board Dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">{title}</h1>
            <p className="mt-2 text-slate-600">{description}</p>
          </div>
          <Link href="/workforce-board/employment" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800">Employment Outcomes</Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>{columns.map((column) => <th key={column.label} className="px-5 py-3 text-left font-semibold text-slate-700">{column.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length ? rows.map((row, index) => (
                  <tr key={String(row.id || row.metric || index)}>
                    {columns.map((column) => <td key={column.label} className="px-5 py-4 text-slate-700">{value(row, column.keys)}</td>)}
                  </tr>
                )) : (
                  <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">No records are currently available for this section.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
