import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { PROGRAM_HOLDER_DOCUMENT_REQUIREMENTS } from '@/lib/program-holder/document-requirements';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Upload Document | Program Holder Portal',
  description: 'Upload a new document',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/documents/upload',
  },
};

export default async function UploadDocumentPage() {
  await requireProgramHolder();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Program Holder', href: '/program-holder/dashboard' },
            { label: 'Documents', href: '/program-holder/documents' },
            { label: 'Upload' },
          ]}
        />
      </div>
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Upload Document</h1>
          <p className="text-lg text-slate-700">
            Upload a required document to complete your program holder profile
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentUploadForm
          requirements={PROGRAM_HOLDER_DOCUMENT_REQUIREMENTS}
          apiEndpoint="/api/program-holder/documents/upload"
          successRedirect="/program-holder/documents"
        />
      </div>
    </div>
  );
}
