import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Plus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Compliance Records | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db.from('sos_organizations').select('id')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: records, error } = org
    ? await db.from('sos_compliance_records').select('*')
        .eq('organization_id', org.id).order('record_type').order('expiration_date', { ascending: true })
    : { data: null, error: null };

  const expiringSoon = (records ?? []).filter((r: any) => {
    if (!r.expiration_date) return false;
    const days = (new Date(r.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 60;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Compliance Records</h1>
              <p className="text-slate-500 text-sm">Licenses, certifications, SAM registration, ETPL listing, insurance</p>
            </div>
          </div>
          <Link href="/admin/submissions/compliance" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Record
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            Compliance records table not yet applied. Run migrations in Supabase Dashboard.
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-semibold">
              {expiringSoon.length} record{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days:{' '}
              {(expiringSoon as any[]).map((r: any) => r.title).join(', ')}
            </p>
          </div>
        )}

        {!records || records.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No compliance records yet</p>
            <p className="text-sm text-slate-500 mb-4">Add SAM registration, state licenses, certifications, and insurance records.</p>
            <Link href="/admin/submissions/compliance" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" /> Add First Record
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Record</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(records as any[]).map(r => {
                  const expiring = r.expiration_date &&
                    (new Date(r.expiration_date).getTime() - Date.now()) / 86400000 <= 60 &&
                    (new Date(r.expiration_date).getTime() - Date.now()) / 86400000 >= 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.record_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'active' ? 'bg-green-100 text-green-800' :
                          r.status === 'expired' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.expiration_date ? (
                          <span className={expiring ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                            {expiring && '⚠️ '}{new Date(r.expiration_date).toLocaleDateString()}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/submissions/compliance/${r.id}`}
                          className="text-xs text-brand-blue-600 hover:underline">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
