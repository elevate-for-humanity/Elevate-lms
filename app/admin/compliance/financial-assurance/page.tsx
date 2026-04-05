import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Financial Assurance | Admin | Elevate For Humanity',
};

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  expired:   'bg-red-100 text-red-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default async function FinancialAssurancePage() {
  await requireAdmin();
  const db = createAdminClient();

  const [{ data: records }, { data: summary }] = await Promise.all([
    db.from('financial_assurance_records')
      .select('*')
      .order('expiration_date', { ascending: true, nullsFirst: false }),
    db.from('v_admin_financial_assurance_summary')
      .select('*')
      .single(),
  ]);

  const s = summary as any;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Compliance', href: '/admin/compliance' }, { label: 'Financial Assurance' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Assurance</h1>
            <p className="text-gray-500 text-sm mt-1">Live records — bonds, insurance, letters of credit</p>
          </div>
          <Link href="/admin/compliance/financial-assurance/new"
            className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Record
          </Link>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Records',       value: s?.total_records ?? 0 },
            { label: 'Active',              value: s?.active_records ?? 0 },
            { label: 'Expired',             value: s?.expired_records ?? 0 },
            { label: 'Expiring in 30 Days', value: s?.expiring_soon_records ?? 0 },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Records</h2>
            {s?.active_coverage_total > 0 && (
              <span className="text-sm text-slate-600">
                Active coverage: <strong>${Number(s.active_coverage_total).toLocaleString()}</strong>
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Provider', 'Type', 'Reference #', 'Coverage', 'Effective', 'Expiration', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(records ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.provider_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.record_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-slate-600">{r.policy_or_reference_number ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.coverage_amount != null ? `$${Number(r.coverage_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.effective_date ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.expiration_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(records ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No financial assurance records. Add your first record to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
