import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Paperclip, CheckCircle2, Clock, AlertTriangle, Plus, Download, XCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Attachment Library | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  w9: 'W-9', insurance_certificate: 'Insurance Cert', general_liability_cert: 'GL Certificate',
  workers_comp_cert: "Workers' Comp", audit_report: 'Audit Report', board_list: 'Board List',
  staff_resume: 'Staff Resume', uei_letter: 'UEI Letter', sam_proof: 'SAM Proof',
  capability_statement: 'Capability Statement', past_performance_summary: 'Past Performance',
  financial_statement: 'Financial Statement', tax_return: 'Tax Return',
  nonprofit_determination: '501(c)(3) Letter', articles_of_incorporation: 'Articles of Inc.',
  bylaws: 'Bylaws', mou: 'MOU', employer_agreement: 'Employer Agreement',
  license: 'License', certification: 'Certification', other: 'Other',
};

export default async function AttachmentLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = await getAdminClient();

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db
    .from('sos_organizations').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: attachments, error } = org
    ? await db.from('sos_attachment_library').select('*')
        .eq('organization_id', org.id).order('document_type').order('created_at', { ascending: false })
    : { data: null, error: null };

  const approved = (attachments ?? []).filter((a: any) => a.status === 'approved').length;
  const expiringSoon = (attachments ?? []).filter((a: any) => {
    if (!a.expiration_date) return false;
    const days = (new Date(a.expiration_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Attachment Library</h1>
              <p className="text-slate-500 text-sm">Pre-approved files ready to include in any submission packet</p>
            </div>
          </div>
          <Link href="/admin/submissions/attachments" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Upload
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Attachment Library tables not yet applied. Run migrations in Supabase Dashboard.</p>
          </div>
        )}

        {expiringSoon > 0 && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-semibold">{expiringSoon} attachment{expiringSoon > 1 ? 's' : ''} expiring within 30 days — renew before including in packets.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div><p className="text-xl font-black text-slate-900">{approved}</p><p className="text-xs text-slate-500">Approved</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div><p className="text-xl font-black text-slate-900">{(attachments ?? []).length - approved}</p><p className="text-xs text-slate-500">Pending / Other</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!attachments || attachments.length === 0 ? (
            <div className="p-10 text-center">
              <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">No attachments yet</p>
              <p className="text-sm text-slate-500 mb-4">Upload W-9, insurance certificates, audit reports, and other required documents.</p>
              <Link href="/admin/submissions/attachments" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
                <Plus className="w-4 h-4" /> Upload First Attachment
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(attachments as any[]).map(att => {
                  const expiring = att.expiration_date &&
                    (new Date(att.expiration_date).getTime() - Date.now()) / 86400000 <= 30 &&
                    (new Date(att.expiration_date).getTime() - Date.now()) / 86400000 >= 0;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">{att.title}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{TYPE_LABELS[att.document_type] ?? att.document_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          att.status === 'approved' ? 'bg-green-100 text-green-800' :
                          att.status === 'expired'  ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>{att.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {att.expiration_date ? (
                          <span className={expiring ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                            {expiring && '⚠️ '}{new Date(att.expiration_date).toLocaleDateString()}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {att.file_url && (
                          <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline">
                            <Download className="w-3.5 h-3.5" /> View
                          </a>
                        )}
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
