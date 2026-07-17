import { requireRole } from '@/lib/auth/require-role';
import type { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DollarSign, TrendingUp, Users, Award, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Incentives | Admin | Elevate For Humanity',
};

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  approved: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  denied: 'bg-red-100 text-red-800',
};

export default async function IncentivesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('incentives')
    .select(
      'id,employer_name,student_name,program_type,amount,status,hours_completed,hours_required,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const incentives = rows ?? [];
  const total = incentives.length;
  const totalAmount = incentives.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pending = incentives.filter((i) => i.status === 'pending').length;
  const paid = incentives.filter((i) => i.status === 'paid').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Incentives</h1>
            <p className="text-slate-500 text-sm mt-1">WEX and OJT employer incentive programs</p>
          </div>
          <Link
            href="/admin/incentives/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Incentive
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Programs', value: total, icon: Award },
            { label: 'Total Amount', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign },
            { label: 'Pending', value: pending, icon: TrendingUp },
            { label: 'Paid Out', value: paid, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border p-4">
              <Icon className="w-5 h-5 text-slate-400 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {incentives.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p>No incentive programs yet.</p>
              <Link
                href="/admin/incentives/create"
                className="text-slate-900 underline text-sm mt-2 inline-block"
              >
                Create one
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Employer', 'Student', 'Type', 'Amount', 'Progress', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incentives.map((inc) => {
                  const pct =
                    inc.hours_required > 0
                      ? Math.min(100, Math.round((inc.hours_completed / inc.hours_required) * 100))
                      : 0;
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {inc.employer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{inc.student_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-medium">
                          {inc.program_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ${Number(inc.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 mb-1">
                          {inc.hours_completed ?? 0} / {inc.hours_required ?? 0} hrs
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${STATUS_STYLES[inc.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/incentives/${inc.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800 space-y-2">
          <p className="font-semibold text-blue-900">About WEX and OJT Programs</p>
          <p>
            <strong>WEX (Work Experience):</strong> Wage subsidies to employers who hire and train
            eligible participants. Typically covers 50% of wages for a limited period.
          </p>
          <p>
            <strong>OJT (On-the-Job Training):</strong> Reimburses employers for training costs.
            Usually covers up to 50% of wages during the training period.
          </p>
        </div>
      </div>
    </div>
  );
}
