import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Briefcase, Award, TrendingUp, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Outcomes Tracking | Elevate For Humanity',
  description: 'Track participant outcomes and success metrics.',
};

export default async function OutcomesPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  const [outcomesRes, enrollmentsRes, certsRes, recentOutcomesRes] = await Promise.all([
    supabase.from('employment_outcomes').select('employment_status, wage_at_placement, wage_at_followup, employer_name, start_date, user_id').limit(1000),
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('employment_outcomes')
      .select('id, employment_status, employer_name, wage_at_placement, wage_at_followup, start_date, profiles(full_name)')
      .order('start_date', { ascending: false })
      .limit(15),
  ]);

  if (outcomesRes.error)       throw new Error(`employment_outcomes query failed: ${outcomesRes.error.message}`);
  if (enrollmentsRes.error)    throw new Error(`program_enrollments count failed: ${enrollmentsRes.error.message}`);
  if (certsRes.error)          throw new Error(`certificates count failed: ${certsRes.error.message}`);
  if (recentOutcomesRes.error) throw new Error(`employment_outcomes recent query failed: ${recentOutcomesRes.error.message}`);

  const outcomes       = outcomesRes.data;
  const totalEnrollments = enrollmentsRes.count;
  const totalCerts     = certsRes.count;
  const recentOutcomes = recentOutcomesRes.data;

  const total = outcomes.length;
  const employed = outcomes.filter((o: any) => o.employment_status === 'employed').length;
  const employmentRate = total > 0 ? Math.round((employed / total) * 100) : 0;
  const credentialRate = (totalEnrollments ?? 0) > 0
    ? Math.round(((totalCerts ?? 0) / (totalEnrollments ?? 1)) * 100) : 0;

  const wageGains = outcomes
    .filter((o: any) => o.wage_at_placement && o.wage_at_followup)
    .map((o: any) => Number(o.wage_at_followup) - Number(o.wage_at_placement));
  const avgWageGain = wageGains.length > 0
    ? (wageGains.reduce((a: number, b: number) => a + b, 0) / wageGains.length).toFixed(2) : '0.00';

  const statusBadge: Record<string, string> = {
    employed: 'bg-green-100 text-green-700',
    unemployed: 'bg-red-100 text-red-700',
    training: 'bg-brand-blue-100 text-brand-blue-700',
    unknown: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Outcomes' }]} />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Outcomes Tracking</h1>
            <p className="text-gray-600 mt-1">Participant employment and credential outcomes</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{employmentRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Employment Rate</p>
            <p className="text-xs text-gray-400 mt-1">{employed} of {total} tracked</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Award className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{credentialRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Credential Rate</p>
            <p className="text-xs text-gray-400 mt-1">{totalCerts || 0} of {totalEnrollments || 0} enrolled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${avgWageGain}/hr</p>
            <p className="text-sm text-gray-500 mt-1">Avg Wage Gain</p>
            <p className="text-xs text-gray-400 mt-1">{wageGains.length} records with data</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500 mt-1">Total Tracked</p>
            <p className="text-xs text-gray-400 mt-1">Employment records</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Status Breakdown</h2>
            <div className="space-y-3">
              {['employed', 'unemployed', 'training', 'unknown'].map((status) => {
                const count = (outcomes || []).filter((o: any) => (o.employment_status || 'unknown') === status).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{status}</span>
                      <span className="font-medium text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status === 'employed' ? 'bg-green-500' : status === 'unemployed' ? 'bg-red-400' : status === 'training' ? 'bg-brand-blue-500' : 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Outcomes Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Employment Records</h2>
              <Link href="/admin/wioa" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">WIOA Report</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Wage</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOutcomes && recentOutcomes.length > 0 ? recentOutcomes.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900">{o.profiles?.full_name || 'Participant'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.employer_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[o.employment_status || 'unknown'] || statusBadge.unknown}`}>
                          {o.employment_status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.wage_at_placement ? `$${Number(o.wage_at_placement).toFixed(2)}/hr` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {o.start_date ? new Date(o.start_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No employment records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
