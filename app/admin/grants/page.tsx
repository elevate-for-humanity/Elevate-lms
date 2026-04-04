import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { Briefcase, DollarSign, CheckCircle, Clock, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Grants | Admin' };

export default async function GrantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
  const [
    { data: grants, count: total },
    { count: active },
    { count: pending },
  ] = await Promise.all([
    db.from('grants')
      .select('id, name, funder, amount, status, start_date, end_date, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <AdminPageShell
      title="Grants"
      description="Federal, state, and private grant tracking"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Grants' }]}
      stats={[
        { label: 'Total Grants',  value: total ?? 0,   icon: Briefcase,   color: 'blue' },
        { label: 'Active',        value: active ?? 0,  icon: CheckCircle, color: 'green' },
        { label: 'Pending',       value: pending ?? 0, icon: Clock,       color: 'amber', alert: (pending ?? 0) > 0 },
      ]}
      actions={
        <Link href="/admin/grants/new" className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Grant
        </Link>
      }
    >
      <AdminCard title="Grant Records">
        {!grants?.length ? (
          <AdminEmptyState icon={Briefcase} title="No grants recorded" description="Add grant records to track funding sources and deadlines." action={{ label: 'Add Grant', href: '/admin/grants/new' }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grant</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Funder</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {grants.map((g: any) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{g.name}</td>
                    <td className="py-3 px-4 text-slate-600">{g.funder ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{g.amount ? `$${Number(g.amount).toLocaleString()}` : '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={g.status ?? 'unknown'} /></td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {g.start_date ? new Date(g.start_date).toLocaleDateString() : '—'}
                      {g.end_date ? ` – ${new Date(g.end_date).toLocaleDateString()}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/grants/${g.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
