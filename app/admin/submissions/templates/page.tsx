import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = { title: 'Document Templates | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/submissions/templates');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db.from('sos_organizations').select('id')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: templates, error } = org
    ? await db.from('sos_document_templates').select('*')
        .eq('organization_id', org.id).eq('active', true)
        .order('document_type').order('template_name')
    : { data: null, error: null };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Document Templates</h1>
              <p className="text-slate-500 text-sm">Branded letterhead layouts with merge fields for every document type</p>
            </div>
          </div>
          <Link href="/admin/submissions/templates/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> New Template
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            Templates table not yet applied. Run migrations in Supabase Dashboard.
          </div>
        )}

        {!templates || templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No templates yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Create branded templates for cover letters, capability statements, budget narratives, and more.
              Use <code className="font-mono text-xs bg-slate-100 px-1 rounded">{'{{org.legal_name}}'}</code> merge fields.
            </p>
            <Link href="/admin/submissions/templates/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" /> Create First Template
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Review?</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(templates as any[]).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.template_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{t.document_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 uppercase">{t.output_format}</td>
                    <td className="px-4 py-3 text-xs">
                      {t.requires_review
                        ? <span className="text-amber-700 font-semibold">Yes</span>
                        : <span className="text-green-700">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/submissions/templates/${t.id}`}
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
