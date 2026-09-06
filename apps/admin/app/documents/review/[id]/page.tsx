import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { DocumentReviewForm } from '@/components/admin/DocumentReviewForm';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';
import { normalizeDocumentReviewStatus } from '@/lib/admin/document-record';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Document | Admin',
  description: 'Review and approve document',
};

export default async function ReviewDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['admin']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: rawDocument, error: documentError } = await db
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (documentError || !rawDocument) return <div className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-black text-slate-950">Document could not be opened</h1><p className="mt-3 text-slate-700">This document is not in the learner-document queue. Return to Document Review and use the Program Holder or WIOA queue for those document types.</p><a href="/documents/review" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Return to Document Review</a></div>;

  // Hydrate profile separately (documents.user_id has no FK to profiles)
  const { data: docReviewProfile } = rawDocument.user_id
    ? await db
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', rawDocument.user_id)
        .maybeSingle()
    : { data: null };
  const document = {
    ...rawDocument,
    status: normalizeDocumentReviewStatus(rawDocument.status),
    profiles: docReviewProfile ?? null,
  };

  // Generate signed URL via centralized admin document access
  const signedUrl = await getAdminDocumentUrl({
    adminId: user.id,
    documentId: document.id,
    context: 'document_review',
  });
  const viewUrl = signedUrl || document.file_url;

  // Pass signed URL to client component via the document object
  const documentWithUrl = { ...document, file_url: viewUrl };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">Review Document</h1>
          <p className="text-lg text-black">Review and approve or reject this document</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentReviewForm document={documentWithUrl} adminId={user.id} />
      </div>
    </div>
  );
}
