import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { AlertTriangle, Users, Clock, TrendingDown, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'At-Risk Students | Admin' };

export default async function AtRiskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();

  // Students flagged at-risk OR with no lesson progress in 14+ days
  const [
    { data: flagged, count: flaggedCount },
    { data: inactive, count: inactiveCount },
  ] = await Promise.all([
    db.from('at_risk_students')
      .select('id, risk_level, reason, flagged_at, student:profiles(id, full_name, email, phone)', { count: 'exact' })
      .order('flagged_at', { ascending: false })
      .limit(50),
    db.from('program_enrollments')
      .select('id, enrolled_at, last_activity_at, student:profiles(id, full_name, email)', { count: 'exact' })
      .eq('enrollment_state', 'active')
      .lte('last_activity_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('last_activity_at', { ascending: true })
      .limit(50),
  ]);

  return (
    <AdminPageShell
      title="At-Risk Students"
      description="Students flagged for intervention or inactive for 14+ days"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'At-Risk' }]}
      stats={[
        { label: 'Flagged',          value: flaggedCount ?? 0,  icon: AlertTriangle, color: 'red',   alert: (flaggedCount ?? 0) > 0 },
        { label: 'Inactive 14+ Days',value: inactiveCount ?? 0, icon: Clock,         color: 'amber', alert: (inactiveCount ?? 0) > 0 },
      ]}
    >
      <div className="space-y-6">
        <AdminCard title="Flagged for Intervention">
          {!flagged?.length ? (
            <AdminEmptyState icon={AlertTriangle} title="No flagged students" description="Students are flagged automatically based on attendance and progress rules." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Level</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Flagged</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flagged.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={r.risk_level ?? 'medium'} /></td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.reason ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{r.flagged_at ? new Date(r.flagged_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/students/${r.student?.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Inactive 14+ Days">
          {!inactive?.length ? (
            <AdminEmptyState icon={Clock} title="No inactive students" description="All active students have recent activity." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Active</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrolled</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {inactive.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString() : 'Never'}</td>
                      <td className="py-3 px-4 text-slate-600">{r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/students/${r.student?.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
