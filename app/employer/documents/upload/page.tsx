import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Upload Document | Employer Portal',
  description: 'Upload a new document',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employer/documents/upload',
  },
};

export default async function UploadDocumentPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employer') redirect('/');

  const { data: requirements } = await db
    .from('document_requirements')
    .select('*')
    .eq('role', 'employer');

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            Upload Document
          </h1>
          <p className="text-lg text-black">
            Upload a required document to complete your profile
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentUploadForm requirements={requirements || []} />
      </div>
    </div>
  );
}
