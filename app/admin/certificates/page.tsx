import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle, Calendar, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Certificates | Admin' };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [certsRes, thisMonthRes] = await Promise.all([
    db.from('program_completion_certificates')
      .select('id, issued_at, certificate_number, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(50),
    db.from('program_completion_certificates')
      .select('*', { count: 'exact', head: true })
      .gte('issued_at', monthStart),
  ]);

  if (certsRes.error)      throw new Error(`program_completion_certificates query failed: ${certsRes.error.message}`);
  if (thisMonthRes.error)  throw new Error(`program_completion_certificates this-month count failed: ${thisMonthRes.error.message}`);

  const certs      = certsRes.data;
  const total      = certsRes.count;
  const thisMonth  = thisMonthRes.count;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Certificates</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">Issued completion certificates and credential records</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Issued',      value: total ?? 0,     icon: Award,        color: 'text-green-600',      bg: 'bg-green-50' },
            { label: 'Issued This Month', value: thisMonth ?? 0, icon: Calendar,     color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Issued Certificates</h2>
            <span className="text-xs text-slate-400">{total ?? 0} total</span>
          </div>
          {!certs?.length ? (
            <div className="py-16 text-center">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No certificates issued yet</p>
              <p className="text-xs text-slate-400 mt-1">Certificates are issued automatically when students complete all program requirements</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Program</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Certificate #</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Issued</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {certs.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{c.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{c.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.program?.title ?? '—'}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{c.certificate_number ?? c.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3.5 px-4 text-slate-500">{c.issued_at ? new Date(c.issued_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/verify/${c.id}`} target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                          Verify <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
