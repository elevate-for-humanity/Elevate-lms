import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Award, Calendar, ChevronRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Certificates | Admin',
};

export default async function CertificatesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [certsRes, thisMonthRes] = await Promise.all([
    db
      .from('program_completion_certificates')
      .select('id, issued_at, certificate_number, user_id, program_id', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(100),
    db
      .from('program_completion_certificates')
      .select('id', { count: 'exact', head: true })
      .gte('issued_at', monthStart),
  ]);

  const certs = certsRes.data ?? [];
  const total = certsRes.count ?? 0;
  const thisMonth = thisMonthRes.count ?? 0;

  // Hydrate profiles and programs
  const userIds = [...new Set(certs.map((c: any) => c.user_id).filter(Boolean))];
  const programIds = [...new Set(certs.map((c: any) => c.program_id).filter(Boolean))];

  const [{ data: profiles }, { data: programs }] = await Promise.all([
    userIds.length
      ? db.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [] },
    programIds.length ? db.from('programs').select('id, title').in('id', programIds) : { data: [] },
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
  const programMap = Object.fromEntries((programs ?? []).map((p: any) => [p.id, p]));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Certificates</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">
          Issued completion certificates and credential records
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: 'Total Issued',
              value: total,
              icon: Award,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Issued This Month',
              value: thisMonth,
              icon: Calendar,
              color: 'text-brand-blue-600',
              bg: 'bg-brand-blue-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
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
            <span className="text-xs text-slate-400">{total} total</span>
          </div>
          {certs.length === 0 ? (
            <div className="py-16 text-center">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No certificates issued yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Certificates are issued automatically when students complete all program
                requirements
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Program', 'Certificate #', 'Issued', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {certs.map((c: any) => {
                  const student = profileMap[c.user_id];
                  const program = programMap[c.program_id];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{program?.title ?? '—'}</td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                        {c.certificate_number ?? c.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/verify/${c.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          Verify <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
