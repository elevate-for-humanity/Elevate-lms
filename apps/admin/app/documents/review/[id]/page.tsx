import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DocumentReviewForm } from '@/components/admin/DocumentReviewForm';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Document | Admin',
  description: 'Review and approve document',
};

export default async function ReviewDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['admin']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: rawDocument } = await db
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!rawDocument) {
    redirect('/documents/review');
  }

  // Hydrate profile separately (documents.user_id has no FK to profiles)
  const { data: docReviewProfile } = rawDocument.user_id
    ? await db
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', rawDocument.user_id)
        .maybeSingle()
    : { data: null };
  const document = { ...rawDocument, profiles: docReviewProfile ?? null };

  // Generate signed URL via centralized admin document access
  let viewUrl = document.file_url;
  if (document.file_path) {
    const url = await getAdminDocumentUrl({
      adminId: user.id,
      documentId: document.id,
      context: 'document_review',
    });
    if (url) viewUrl = url;
  }

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
