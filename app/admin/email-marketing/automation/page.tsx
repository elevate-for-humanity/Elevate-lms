import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Email Automations | Admin | Elevate For Humanity',
};

const STATUS_BADGE: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
};

export default async function EmailAutomationPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: automations, error: automationsError } = await db
    .from('email_automations')
    .select('*')
    .order('updated_at', { ascending: false });

  const rows = automationsError ? [] : (automations ?? []);
  const active = rows.filter((r: any) => r.is_active).length;
  const totalRecipients = rows.reduce((sum: number, r: any) => sum + (r.total_recipients ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Email Marketing', href: '/admin/email-marketing' }, { label: 'Automations' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Automations</h1>
            <p className="text-gray-500 text-sm mt-1">Live workflow records from the database</p>
          </div>
          <Link href="/admin/email-marketing/automation/new"
            className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Automation
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Automations', value: rows.length },
            { label: 'Active',            value: active },
            { label: 'Total Recipients',  value: totalRecipients.toLocaleString() },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">Workflows</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Name', 'Trigger', 'Audience', 'Active', 'Last Run', 'Recipients', 'Last Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.trigger_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-slate-600">{r.audience_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.last_run_at ? new Date(r.last_run_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.last_recipient_count}</td>
                    <td className="px-4 py-3">
                      {r.last_run_status ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.last_run_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {r.last_run_status}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No automations yet. Create your first workflow to get started.
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
