import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { Building2, Users, Briefcase, CheckCircle, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Employers | Admin' };

export default async function EmployersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
  const [
    { data: employers, count: totalEmployers },
    { count: activePartners },
    { count: openJobs },
  ] = await Promise.all([
    db.from('employers').select('id, name, industry, city, state, status, created_at, contact_email', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(50),
    db.from('employers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  return (
    <AdminPageShell
      title="Employer Management"
      description="Partner employers, job postings, and OJT placements"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Employers' }]}
      stats={[
        { label: 'Total Employers',   value: totalEmployers ?? 0, icon: Building2,   color: 'blue' },
        { label: 'Active Partners',   value: activePartners ?? 0, icon: CheckCircle, color: 'green' },
        { label: 'Open Jobs',         value: openJobs ?? 0,       icon: Briefcase,   color: 'amber' },
      ]}
      actions={
        <Link href="/admin/employers/new" className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Employer
        </Link>
      }
    >
      <AdminCard title="Employer Partners">
        {!employers?.length ? (
          <AdminEmptyState icon={Building2} title="No employers yet" description="Add your first employer partner to get started." action={{ label: 'Add Employer', href: '/admin/employers/new' }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Industry</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employers.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{e.name}</td>
                    <td className="py-3 px-4 text-slate-600">{e.industry ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{[e.city, e.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={e.status ?? 'unknown'} /></td>
                    <td className="py-3 px-4 text-slate-600">{e.contact_email ?? '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/employers/${e.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">View</Link>
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
