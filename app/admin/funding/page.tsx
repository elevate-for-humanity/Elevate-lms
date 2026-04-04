import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { DollarSign, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Funding | Admin' };

export default async function FundingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
  const [
    { data: records, count: total },
    { count: approved },
    { count: pending },
    { count: expiring },
  ] = await Promise.all([
    db.from('funding_records')
      .select('id, source, amount, status, approved_at, expiration_date, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('funding_records').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('funding_records').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('funding_records').select('*', { count: 'exact', head: true })
      .lte('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .gte('expiration_date', new Date().toISOString()),
  ]);

  const FUNDING_LINKS = [
    { label: 'WIOA Participants',     href: '/admin/wioa',                  icon: TrendingUp },
    { label: 'Grants',                href: '/admin/grants',                icon: DollarSign },
    { label: 'Funding Verification',  href: '/admin/funding-verification',  icon: CheckCircle },
    { label: 'Payroll',               href: '/admin/payroll',               icon: DollarSign },
  ];

  return (
    <AdminPageShell
      title="Funding"
      description="Student funding records, WIOA, grants, and payment tracking"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Funding' }]}
      stats={[
        { label: 'Total Records',      value: total ?? 0,    icon: DollarSign,    color: 'blue' },
        { label: 'Approved',           value: approved ?? 0, icon: CheckCircle,   color: 'green' },
        { label: 'Pending',            value: pending ?? 0,  icon: Clock,         color: 'amber', alert: (pending ?? 0) > 0 },
        { label: 'Expiring (30 days)', value: expiring ?? 0, icon: AlertTriangle, color: 'red',   alert: (expiring ?? 0) > 0 },
      ]}
    >
      <div className="space-y-6">
        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FUNDING_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <Icon className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <AdminCard title="Funding Records">
          {!records?.length ? (
            <AdminEmptyState icon={DollarSign} title="No funding records" description="Funding records are created when students are approved for WIOA, WRG, or other funding sources." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.program?.title ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{r.source ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{r.amount ? `$${Number(r.amount).toLocaleString()}` : '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={r.status ?? 'unknown'} /></td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/funding/${r.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
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
