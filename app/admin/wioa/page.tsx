import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { HeartHandshake, FileText, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'WIOA | Admin' };

export default async function WioaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
  const [
    { data: participants, count: total },
    { count: approved },
    { count: pending },
    { count: expiringSoon },
  ] = await Promise.all([
    db.from('wioa_participants')
      .select('id, status, funding_amount, approved_at, expiration_date, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('wioa_participants').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('wioa_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('wioa_participants').select('*', { count: 'exact', head: true })
      .lte('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .gte('expiration_date', new Date().toISOString()),
  ]);

  return (
    <AdminPageShell
      title="WIOA Participants"
      description="Workforce Innovation and Opportunity Act funding and participant tracking"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'WIOA' }]}
      stats={[
        { label: 'Total Participants', value: total ?? 0,       icon: HeartHandshake, color: 'blue' },
        { label: 'Approved',           value: approved ?? 0,    icon: CheckCircle,    color: 'green' },
        { label: 'Pending Review',     value: pending ?? 0,     icon: Clock,          color: 'amber', alert: (pending ?? 0) > 0 },
        { label: 'Expiring (30 days)', value: expiringSoon ?? 0,icon: AlertTriangle,  color: 'red',   alert: (expiringSoon ?? 0) > 0 },
      ]}
      actions={
        <Link href="/admin/wioa/new" className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Participant
        </Link>
      }
    >
      <AdminCard title="WIOA Participants">
        {!participants?.length ? (
          <AdminEmptyState icon={HeartHandshake} title="No WIOA participants" description="Add participants to track WIOA funding and eligibility." action={{ label: 'Add Participant', href: '/admin/wioa/new' }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Funding</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {participants.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{p.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{p.student?.email ?? ''}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.program?.title ?? '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status ?? 'unknown'} /></td>
                    <td className="py-3 px-4 text-slate-600">{p.funding_amount ? `$${Number(p.funding_amount).toLocaleString()}` : '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.expiration_date ? new Date(p.expiration_date).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/wioa/${p.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
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
