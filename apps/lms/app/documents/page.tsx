import type { Metadata } from 'next';
import { FileText, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';

export const metadata: Metadata = { title: 'Documents | Elevate for Humanity', description: 'View and manage your documents' };
export const dynamic = 'force-dynamic';

type DocumentRow = {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expires_at?: string;
};

function normalize(row: any, fallback: string): DocumentRow {
  return {
    id: row.id,
    title: row.name || row.title || fallback,
    description: row.description || undefined,
    file_url: row.file_url || '',
    status: row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending',
    created_at: row.created_at,
    expires_at: row.expires_at || undefined,
  };
}

export default async function DocumentsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [documentsRes, employerRes, enrollmentRes] = await Promise.all([
    supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('employer_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('enrollment_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  const allDocuments: DocumentRow[] = [
    ...(documentsRes.data || []).map((row: any) => normalize(row, 'Document')),
    ...(employerRes.data || []).map((row: any) => normalize(row, 'Employer Document')),
    ...(enrollmentRes.data || []).map((row: any) => normalize(row, 'Enrollment Document')),
  ];

  const statusIcon = (status: DocumentRow['status']) => status === 'approved'
    ? <CheckCircle className="h-5 w-5 text-green-600" />
    : status === 'rejected'
      ? <XCircle className="h-5 w-5 text-red-600" />
      : <Clock className="h-5 w-5 text-amber-600" />;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3"><FileText className="h-8 w-8 text-brand-blue-600" /><h1 className="text-3xl font-bold text-slate-950">My Documents</h1></div>
        {allDocuments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm"><FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="mb-2 text-xl font-semibold text-slate-950">No Documents Yet</h2><p className="text-slate-600">Documents will appear here once they are uploaded or shared with you.</p></div>
        ) : (
          <div className="grid gap-5">
            {allDocuments.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="text-lg font-semibold text-slate-950">{doc.title}</h2>{doc.description ? <p className="mt-1 text-sm text-slate-600">{doc.description}</p> : null}</div>
                  <div className="flex items-center gap-2">{statusIcon(doc.status)}<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{doc.status}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500"><span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>{doc.expires_at ? <span>Expires {new Date(doc.expires_at).toLocaleDateString()}</span> : null}</div>
                {doc.file_url ? <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white">Open document <ExternalLink className="h-4 w-4" /></a> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
