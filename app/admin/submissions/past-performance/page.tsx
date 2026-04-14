import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Past Performance | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

export default async function PastPerformancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db.from('sos_organizations').select('id')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: records, error } = org
    ? await db.from('sos_past_performance').select('*')
        .eq('organization_id', org.id).order('end_date', { ascending: false })
    : { data: null, error: null };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Past Performance</h1>
              <p className="text-slate-500 text-sm">Approved project history for capability statements and RFP responses</p>
            </div>
          </div>
          <Link href="/admin/submissions/past-performance" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Record
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            Past performance table not yet applied. Run migrations in Supabase Dashboard.
          </div>
        )}

        {!records || records.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No past performance records yet</p>
            <p className="text-sm text-slate-500 mb-4">Add approved project history to use in capability statements and RFP responses.</p>
            <Link href="/admin/submissions/past-performance" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" /> Add First Record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(records as any[]).map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-900">{r.project_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}>{r.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">{r.client_name} · {r.project_type}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {r.start_date && new Date(r.start_date).getFullYear()}
                      {r.start_date && r.end_date && ' – '}
                      {r.end_date && new Date(r.end_date).getFullYear()}
                      {r.contract_value && ` · $${Number(r.contract_value).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                  </div>
                  <Link href={`/admin/submissions/past-performance/${r.id}`}
                    className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition flex-shrink-0">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
