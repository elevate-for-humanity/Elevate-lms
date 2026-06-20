import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import ProgramHolderDocumentsClient from './ProgramHolderDocumentsClient';
import { programHolderDocumentStatus } from '@/lib/program-holder/document-requirements';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Program Holder Documents | Admin | Elevate For Humanity' };

export default async function ProgramHolderDocumentsPage() {
  // Auth and admin-role enforcement are handled by apps/admin/app/admin/layout.tsx.
  // Avoid re-checking with the anon client here; RLS can block profile reads and
  // incorrectly send valid admins to /unauthorized.
  const db = await getAdminClient();

  if (!db) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-slate-600">
          Document review is temporarily unavailable (database connection). Try again shortly.
        </p>
      </div>
    );
  }

  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { data: docs },
  ] = await Promise.all([
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('program_holder_documents').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    db
      .from('program_holder_documents')
      .select(
        'id, user_id, document_type, file_name, file_url, file_size, mime_type, status, approved, reviewed_at, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const userIds = [...new Set((docs ?? []).map((d) => d.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const docsWithProfiles = (docs ?? []).map((doc) => ({
    id: doc.id,
    user_id: doc.user_id,
    document_type: doc.document_type,
    file_name: doc.file_name,
    file_path: doc.file_url,
    file_size: doc.file_size,
    mime_type: doc.mime_type,
    status: programHolderDocumentStatus(doc),
    reviewed_at: doc.reviewed_at,
    created_at: doc.created_at,
    profiles: profileById.get(doc.user_id) ?? null,
  }));

  const stats = [
    { label: 'Pending Review', value: pending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: approved ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: rejected ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/program-holders" className="hover:text-slate-700">
            Program Holders
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Documents</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Program Holder Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review files uploaded from the program holder portal (not generic student documents)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <ProgramHolderDocumentsClient initialDocs={docsWithProfiles} />
    </div>
  );
}
