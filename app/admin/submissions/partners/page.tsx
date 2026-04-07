import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Partner Entities | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

export default async function PartnerEntitiesPage() {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db.from('sos_organizations').select('id')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: partners, error } = org
    ? await db.from('sos_partner_entities').select('*')
        .eq('organization_id', org.id).order('legal_name')
    : { data: null, error: null };

  const approved = (partners ?? []).filter((p: any) => p.approved_for_use).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Partner Entities</h1>
              <p className="text-slate-500 text-sm">Approved subcontractors, MOU partners, co-applicants, letter-of-support providers</p>
            </div>
          </div>
          <Link href="/admin/submissions/partners/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Partner
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            Partner entities table not yet applied. Run migrations in Supabase Dashboard.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div><p className="text-xl font-black text-slate-900">{approved}</p><p className="text-xs text-slate-500">Approved for Use</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-400" />
            <div><p className="text-xl font-black text-slate-900">{(partners ?? []).length}</p><p className="text-xs text-slate-500">Total Partners</p></div>
          </div>
        </div>

        {!partners || partners.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No partner entities yet</p>
            <p className="text-sm text-slate-500 mb-4">Add approved partners for use in subcontractor packets, MOUs, and letters of support.</p>
            <Link href="/admin/submissions/partners/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" /> Add First Partner
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Relationship</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(partners as any[]).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.legal_name}</p>
                      {p.dba_name && <p className="text-xs text-slate-400">DBA: {p.dba_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.relationship_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.contact_name && <p>{p.contact_name}</p>}
                      {p.contact_email && <p className="text-slate-500">{p.contact_email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.approved_for_use
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <span className="text-xs text-amber-600 font-semibold">Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/submissions/partners/${p.id}`}
                        className="text-xs text-brand-blue-600 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
