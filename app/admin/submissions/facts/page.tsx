import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, CheckCircle2, Clock, XCircle, AlertTriangle, Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Facts Vault | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  approved:       'bg-green-100 text-green-800',
  pending_review: 'bg-amber-100 text-amber-800',
  draft:          'bg-slate-100 text-slate-600',
  rejected:       'bg-red-100 text-red-700',
  expired:        'bg-slate-100 text-slate-400',
};

export default async function FactsVaultPage() {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/submissions/facts');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db
    .from('sos_organizations').select('id, legal_name')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: facts, error } = org
    ? await db.from('sos_organization_facts').select('*')
        .eq('organization_id', org.id).order('fact_key', { ascending: true })
    : { data: null, error: null };

  const approved = (facts ?? []).filter((f: any) => f.status === 'approved').length;
  const pending  = (facts ?? []).filter((f: any) => f.status === 'pending_review').length;
  const draft    = (facts ?? []).filter((f: any) => f.status === 'draft').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Facts Vault</h1>
              <p className="text-slate-500 text-sm">Approved atomic facts — the only values inserted into generated documents</p>
            </div>
          </div>
          <Link href="/admin/submissions/facts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Fact
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Facts Vault tables not yet applied. Run migrations 20260527000005 in Supabase Dashboard.</p>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Approved', count: approved, icon: CheckCircle2, cls: 'text-green-600' },
            { label: 'Pending Review', count: pending, icon: Clock, cls: 'text-amber-600' },
            { label: 'Draft', count: draft, icon: XCircle, cls: 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.cls}`} />
              <div>
                <p className="text-xl font-black text-slate-900">{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Facts table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!facts || facts.length === 0 ? (
            <div className="p-10 text-center">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">No facts yet</p>
              <p className="text-sm text-slate-500 mb-4">Add approved facts to use as merge fields in generated documents.</p>
              <Link href="/admin/submissions/facts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
                <Plus className="w-4 h-4" /> Add First Fact
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Key</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(facts as any[]).map(fact => (
                  <tr key={fact.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-brand-blue-700 font-semibold">
                      {'{{fact.' + fact.fact_key + '}}'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                      {typeof fact.fact_value_json === 'object'
                        ? JSON.stringify(fact.fact_value_json)
                        : String(fact.fact_value_json)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fact.source_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[fact.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {fact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {fact.expires_at ? new Date(fact.expires_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Only <strong>approved</strong> facts are inserted into generated documents. Draft and pending facts are visible here but blocked from packet generation.
        </p>
      </div>
    </div>
  );
}
