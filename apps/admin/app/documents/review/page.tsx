import { SecureDocumentLink } from '@/components/admin/SecureDocumentLink';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, XCircle, Clock, Eye } from 'lucide-react';
import {
  normalizeDocumentReviewStatus,
  resolveDocumentStorageLocator,
} from '@/lib/admin/document-record';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Documents | Admin',
  description: 'Review and approve uploaded documents',
};

export default async function AdminDocumentReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(['admin']);
  const supabase = await requireAdminClient();
  const requestedStatus = (await searchParams).status;
  const activeStatus = ['pending', 'approved', 'rejected'].includes(requestedStatus ?? '')
    ? requestedStatus
    : 'all';

  // Get all documents with user info
  const { data: rawDocuments, error: documentsError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (documentsError) console.error('[Documents] query failed:', documentsError.message);

  // Hydrate profiles separately (user_id has no FK to profiles)
  const docUserIds = [...new Set((rawDocuments ?? []).map((d: any) => d.user_id).filter(Boolean))];
  const { data: docProfiles } = docUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email, role').in('id', docUserIds)
    : { data: [] };
  const docProfileMap = Object.fromEntries((docProfiles ?? []).map((p: any) => [p.id, p]));
  const hydratedDocuments = (rawDocuments ?? []).map((d: any) => ({
    ...d,
    profiles: docProfileMap[d.user_id] ?? null,
    review_status: normalizeDocumentReviewStatus(d.status),
    has_storage_locator: Boolean(resolveDocumentStorageLocator(d)),
  }));
  const isQaDocument = (doc: any) =>
    [doc.file_name, doc.profiles?.full_name, doc.profiles?.email]
      .filter(Boolean)
      .some((value) => /(^|[\s_.-])(qa|test|synthetic)([\s_.-]|$)/i.test(String(value)));
  const qaDocuments = hydratedDocuments.filter(isQaDocument);
  const documents = hydratedDocuments.filter((doc) => !isQaDocument(doc));

  // Document viewing is handled on-demand via SecureDocumentLink,
  // which routes through /api/admin/documents/signed-url with audit logging.
  // No server-side signed URLs are generated here.
  const docsWithUrls = (documents || []).map((doc) => ({
    ...doc,
    view_url: null, // URLs generated on-demand via SecureDocumentLink
  }));

  const pendingDocs = docsWithUrls.filter((d) => d.review_status === 'pending') || [];
  const approvedDocs = docsWithUrls.filter((d) => d.review_status === 'approved') || [];
  const rejectedDocs = docsWithUrls.filter((d) => d.review_status === 'rejected') || [];
  const visibleDocuments =
    activeStatus === 'all'
      ? docsWithUrls
      : docsWithUrls.filter((doc) => doc.review_status === activeStatus);
  const documentTypeLabel = (value: unknown) =>
    typeof value === 'string' && value.trim()
      ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
      : 'Uploaded Document';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-brand-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-black border-slate-300';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      {/* Header */}
      <section className="border-b py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">Document Review</h1>
              <p className="text-lg text-black">Review and approve uploaded documents</p>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-brand-blue-300 bg-brand-blue-50 p-5"><p className="font-black text-slate-950">Learner & Apprentice Documents</p><p className="mt-1 text-sm text-slate-700">You are viewing the primary learner-document queue below.</p></div>
          <Link href="/program-holder-documents" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-blue-400"><p className="font-black text-slate-950">Program Holder Documents</p><p className="mt-1 text-sm text-slate-700">Open agreements, insurance, licenses, and provider files.</p></Link>
          <Link href="/wioa/documents" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-blue-400"><p className="font-black text-slate-950">WIOA Documents</p><p className="mt-1 text-sm text-slate-700">Open funding eligibility and workforce documentation.</p></Link>
        </div>
        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">{documents?.length || 0}</span>
            </div>
            <div className="text-sm text-black">Total Documents</div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-900">{pendingDocs.length}</span>
            </div>
            <div className="text-sm text-yellow-900 font-semibold">Pending Review</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-3xl font-bold text-black">{approvedDocs.length}</span>
            </div>
            <div className="text-sm text-black">Approved</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-brand-red-600" />
              <span className="text-3xl font-bold text-black">{rejectedDocs.length}</span>
            </div>
            <div className="text-sm text-black">Rejected</div>
          </div>
          <div className="rounded-lg border bg-slate-50 p-6">
            <div className="mb-2 flex items-center justify-between">
              <FileText className="h-8 w-8 text-slate-500" />
              <span className="text-3xl font-bold text-slate-800">{qaDocuments.length}</span>
            </div>
            <div className="text-sm text-slate-700">QA/test uploads excluded</div>
          </div>
        </div>

        {/* Pending Documents */}
        {pendingDocs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Pending Review ({pendingDocs.length})
            </h2>
            <div className="space-y-3">
              {pendingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.review_status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">{doc.file_name}</h3>
                      <p className="text-sm text-black">
                        {documentTypeLabel(doc.document_type)}{' '}
                        •{(doc.profiles as any)?.full_name || 'Unknown User'} (
                        {(doc.profiles as any)?.role}) • Uploaded{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/documents/review/${doc.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Documents */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-black mb-4">All Documents</h2>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {[
              ['all', 'All', documents.length],
              ['pending', 'Pending', pendingDocs.length],
              ['approved', 'Approved', approvedDocs.length],
              ['rejected', 'Rejected', rejectedDocs.length],
            ].map(([status, label, count]) => (
              <Link
                key={String(status)}
                href={status === 'all' ? '/documents/review' : `/documents/review?status=${status}`}
                aria-current={activeStatus === status ? 'page' : undefined}
                className={`px-4 py-2 font-semibold ${activeStatus === status ? 'border-b-2 border-brand-blue-600 text-brand-blue-600' : 'text-black hover:text-brand-blue-700'}`}
              >
                {label} ({count})
              </Link>
            ))}
          </div>

          {visibleDocuments.length > 0 ? (
            <div className="space-y-3">
              {visibleDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.review_status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">{doc.file_name}</h3>
                      <p className="text-sm text-black">
                        {documentTypeLabel(doc.document_type)}{' '}
                        •{(doc.profiles as any)?.full_name || 'Unknown User'} (
                        {(doc.profiles as any)?.role}) • Uploaded{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <p className="text-sm text-brand-red-600 mt-1">
                          <strong>Reason:</strong> {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-2 rounded-full text-xs font-semibold border ${getStatusBadge(doc.review_status)}`}
                    >
                      {doc.review_status.charAt(0).toUpperCase() + doc.review_status.slice(1)}
                    </span>
                    {doc.has_storage_locator ? (
                      <SecureDocumentLink documentId={doc.id} />
                    ) : (
                      <span className="text-slate-500 text-sm">No file</span>
                    )}
                    <Link
                      href={`/documents/review/${doc.id}`}
                      className="px-4 py-2 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-black">No documents to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
