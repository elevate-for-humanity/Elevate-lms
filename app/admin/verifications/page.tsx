import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle, Clock, XCircle, Eye, ArrowRight } from 'lucide-react';
import { AdminPageShell, AdminCard, AdminEmptyState } from '@/components/admin/AdminPageShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Verifications | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

export default async function VerificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(\'/login\');

  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const [
    { data: verifications, count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
  ] = await Promise.all([
    db.from('id_verifications')
      .select('id, status, id_type, first_name, last_name, created_at, profiles:user_id(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('id_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('id_verifications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('id_verifications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  return (
    <AdminPageShell
      title="ID Verifications"
      description="Review and approve identity verification submissions."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Verifications' }]}
      stats={[
        { label: 'Total',    value: total ?? 0,    icon: Shield,       color: 'slate' },
        { label: 'Pending',  value: pending ?? 0,  icon: Clock,        color: 'amber', alert: (pending ?? 0) > 0 },
        { label: 'Approved', value: approved ?? 0, icon: CheckCircle,  color: 'green' },
        { label: 'Rejected', value: rejected ?? 0, icon: XCircle,      color: 'red' },
      ]}
      actions={
        <Link
          href="/admin/verifications/review"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition-colors"
        >
          <Eye className="w-4 h-4" /> Review Queue
        </Link>
      }
    >
      <AdminCard>
        {verifications && verifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">ID Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Submitted</div>
              <div className="col-span-1" />
            </div>
            {verifications.map((v: any) => {
              const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
              const name = v.first_name && v.last_name
                ? `${v.first_name} ${v.last_name}`
                : profile?.full_name ?? '—';
              const idTypeLabel = (v.id_type ?? '—')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());

              return (
                <div key={v.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-slate-500 truncate">{profile?.email ?? '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600">{idTypeLabel}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[v.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {v.status ?? '—'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-slate-400">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div className="col-span-1 text-right">
                    <Link
                      href={`/admin/verifications/review/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                    >
                      Review <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState message="No verification submissions yet." />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
