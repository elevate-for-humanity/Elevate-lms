import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { FileSignature, Clock, XCircle, Plus } from 'lucide-react';
import { SignatureLinkCopier } from './SignatureLinkCopier';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/signatures',
  },
  title: 'Signatures Management | Elevate For Humanity',
  description:
    'Manage digital signatures, document approvals, and electronic consent forms.',
};

export default async function SignaturesPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [signaturesResult, docsResult] = await Promise.all([
    db
      .from('signatures')
      .select('id, document_id, signer_name, signer_email, role, status, created_at, signature_documents(title)')
      .order('created_at', { ascending: false }),
    db
      .from('signature_documents')
      .select('id, title, type, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (signaturesResult.error) throw new Error(`signatures query failed: ${signaturesResult.error.message}`);
  const signatures = signaturesResult.data;
  const signatureDocs = docsResult.data ?? [];

  const rows = signatures ?? [];
  const totalSignatures = rows.length;
  const pendingSignatures = rows.filter((s: any) => !s.status || s.status === 'pending').length;
  const completedSignatures = rows.filter((s: any) => s.status === 'completed').length;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Signatures" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-signatures-hero.jpg"
          alt="Signatures Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileSignature className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Signatures
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalSignatures || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-11 w-11 text-brand-orange-600" />
                  <h3 className="text-sm font-medium text-black">Pending</h3>
                </div>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {pendingSignatures || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <h3 className="text-sm font-medium text-black">
                    Completed
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {completedSignatures || 0}
                </p>
              </div>
            </div>

            {/* Signature Documents — admin-created docs with shareable sign links */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Signature Documents</h2>
                <Link
                  href="/admin/signatures/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Document
                </Link>
              </div>
              {signatureDocs.length > 0 ? (
                <div className="space-y-3">
                  {signatureDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900">{doc.title}</p>
                        <p className="text-sm text-slate-500">
                          {doc.type?.replace(/_/g, ' ')} · Created {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <SignatureLinkCopier documentId={doc.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-6">
                  No documents yet.{' '}
                  <Link href="/admin/signatures/new" className="text-brand-blue-600 hover:underline">
                    Create one
                  </Link>{' '}
                  to send for signature.
                </p>
              )}
            </div>

            {/* Signatures List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Signatures</h2>
              {rows.length > 0 ? (
                <div className="space-y-4">
                  {rows.map((signature: any) => (
                    <div
                      key={signature.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {signature.signature_documents?.title || 'Untitled Document'}
                          </h3>
                          <p className="text-sm text-black mt-1">
                            Signer:{' '}
                            {signature.signer_name || signature.signer_email || 'Unknown'}
                          </p>
                          <p className="text-sm text-black">
                            Signed:{' '}
                            {new Date(signature.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(!signature.status || signature.status === 'completed') && (
                            <span className="flex items-center gap-1 text-brand-green-600 text-sm font-medium bg-brand-green-100 px-3 py-2 rounded-full">
                              <span className="text-brand-green-600 flex-shrink-0">✓</span>
                              Signed
                            </span>
                          )}
                          {signature.status === 'pending' && (
                            <span className="flex items-center gap-1 text-brand-orange-600 text-sm font-medium bg-brand-orange-100 px-3 py-2 rounded-full">
                              <Clock className="h-4 w-4" />
                              Pending
                            </span>
                          )}
                          {signature.status === 'declined' && (
                            <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-100 px-3 py-2 rounded-full">
                              <XCircle className="h-4 w-4" />
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">
                  No signatures found
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Digital Signatures
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Manage e-signature workflows for enrollment and compliance documents.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/signatures"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Signatures
              </Link>
              <Link
                href="/admin/document-center"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Document Center
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
