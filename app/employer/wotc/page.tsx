import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { TrendingUp, BadgeDollarSign, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WOTC Credits | Employer Portal',
  description: 'Track potential Work Opportunity Tax Credit outcomes from hiring activity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/wotc' },
};

const MAX_WOTC_PER_HIRE = 2400;

export default async function EmployerWotcPage() {
  const { user } = await requireRole(['employer', 'admin']);
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title')
    .eq('employer_id', user.id);

  const jobIds = (jobs ?? []).map((j: any) => j.id);
  const jobMap = Object.fromEntries((jobs ?? []).map((j: any) => [j.id, j.title]));

  const { data: hires } = jobIds.length
    ? await supabase
        .from('job_applications')
        .select('id, job_posting_id, applicant_name, status, updated_at')
        .in('job_posting_id', jobIds)
        .eq('status', 'hired')
        .order('updated_at', { ascending: false })
    : { data: [] };

  const hiredRows = hires ?? [];
  const currentYear = new Date().getFullYear();
  const hiredThisYear = hiredRows.filter((h: any) => {
    if (!h.updated_at) return false;
    return new Date(h.updated_at).getFullYear() === currentYear;
  }).length;

  const estimatedCreditRangeLow = hiredThisYear * 1200;
  const estimatedCreditRangeHigh = hiredThisYear * MAX_WOTC_PER_HIRE;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Employer Portal</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">WOTC Credits</h1>
            <p className="text-slate-600 mt-1">Estimated tax credit opportunity based on confirmed hires.</p>
          </div>
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Briefcase className="w-4 h-4" />
            Job Postings
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Metric
            label={`Hired in ${currentYear}`}
            value={hiredThisYear.toString()}
            icon={<span className="w-5 h-5 rounded-full bg-brand-green-600 inline-block flex-shrink-0" aria-hidden="true" />}
          />
          <Metric
            label="Estimated Credit (Low)"
            value={`$${estimatedCreditRangeLow.toLocaleString()}`}
            icon={<BadgeDollarSign className="w-5 h-5 text-brand-blue-600" />}
          />
          <Metric
            label="Estimated Credit (High)"
            value={`$${estimatedCreditRangeHigh.toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-brand-orange-600" />}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-bold text-slate-900 mb-2">How this estimate works</h2>
          <p className="text-sm text-slate-700">
            This page estimates potential WOTC impact from hires recorded in your employer pipeline.
            Final credit eligibility depends on IRS forms, state workforce verification, and employee target-group qualification.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Hires</h2>
            <span className="text-sm text-slate-500">{hiredRows.length} total</span>
          </div>

          {hiredRows.length === 0 ? (
            <div className="p-10 text-center">
              <span className="w-12 h-12 rounded-full bg-slate-300 inline-block flex-shrink-0 mx-auto mb-3" aria-hidden="true" />
              <p className="font-semibold text-slate-800">No hires recorded yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Mark candidates as hired in your applications workflow to track WOTC impact here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Candidate</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Role</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Hired Date</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Est. Max Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hiredRows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{row.applicant_name || 'Candidate'}</td>
                      <td className="px-5 py-3 text-slate-700">{jobMap[row.job_posting_id] || 'Role unavailable'}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-5 py-3 text-slate-900 font-semibold">${MAX_WOTC_PER_HIRE.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-600">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
