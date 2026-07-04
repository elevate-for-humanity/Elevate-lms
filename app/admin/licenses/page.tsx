import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Licenses | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function AdminLicensesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: licenses } = await supabase
    .from('licenses')
    .select('id,company_name,admin_email,tier,plan_type,status,max_users,max_programs,expires_at,valid_until,stripe_subscription_id,created_at')
    .order('created_at', { ascending: false });

  const rows = licenses ?? [];
  const active   = rows.filter(l => l.status === 'active');
  const expiring = rows.filter(l => {
    const exp = l.expires_at ?? l.valid_until;
    if (!exp) return false;
    const days = (new Date(exp).getTime() - Date.now()) / 86400000;
    return days > 0 && days < 30;
  });
  const inactive = rows.filter(l => l.status !== 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Licenses' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Licenses</h1>
            <p className="text-sm text-slate-500 mt-1">{rows.length} total · {active.length} active · {expiring.length} expiring soon</p>
          </div>
          <Link href="/admin/licenses/create">
            <Button>New License</Button>
          </Link>
        </div>

        {expiring.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">⚠️ {expiring.length} license{expiring.length !== 1 ? 's' : ''} expiring within 30 days</p>
            {expiring.map(l => (
              <p key={l.id} className="text-xs text-amber-700 mt-1">
                {l.company_name ?? l.admin_email} — expires {new Date(l.expires_at ?? l.valid_until).toLocaleDateString()}
              </p>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Organization', 'Admin', 'Plan', 'Status', 'Users', 'Programs', 'Expires', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No licenses found</td></tr>
              )}
              {rows.map(l => {
                const exp = l.expires_at ?? l.valid_until;
                const expStr = exp ? new Date(exp).toLocaleDateString() : '—';
                const statusColor = l.status === 'active' ? 'bg-green-100 text-green-700' : l.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600';
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{l.company_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{l.admin_email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{l.plan_type ?? l.tier ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-slate-600">{l.max_users ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{l.max_programs ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{expStr}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/licenses/${l.id}`} className="text-xs font-semibold text-brand-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inactive.length > 0 && (
          <p className="text-xs text-slate-400 mt-4">{inactive.length} inactive/suspended license{inactive.length !== 1 ? 's' : ''} included above.</p>
        )}
      </div>
    </div>
  );
}
