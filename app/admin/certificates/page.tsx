import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';
import { Award, CheckCircle, Clock, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Certificates | Admin' };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
  const [
    { data: certs, count: totalCerts },
    { count: issuedThisMonth },
  ] = await Promise.all([
    db.from('program_completion_certificates')
      .select('id, issued_at, certificate_number, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(50),
    db.from('program_completion_certificates')
      .select('*', { count: 'exact', head: true })
      .gte('issued_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  return (
    <AdminPageShell
      title="Certificates"
      description="Issued completion certificates and credential records"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Certificates' }]}
      stats={[
        { label: 'Total Issued',      value: totalCerts ?? 0,      icon: Award,        color: 'green' },
        { label: 'Issued This Month', value: issuedThisMonth ?? 0, icon: CheckCircle,  color: 'blue' },
      ]}
    >
      <AdminCard title="Issued Certificates">
        {!certs?.length ? (
          <AdminEmptyState icon={Award} title="No certificates yet" description="Certificates are issued automatically when students complete all program requirements." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificate #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Issued</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {certs.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{c.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{c.student?.email ?? ''}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.program?.title ?? '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{c.certificate_number ?? c.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-slate-600">{c.issued_at ? new Date(c.issued_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/verify/${c.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">Verify</Link>
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
