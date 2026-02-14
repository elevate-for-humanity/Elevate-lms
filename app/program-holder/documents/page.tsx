import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'My Documents | Program Holder Portal',
  description: 'View and manage your documents',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/documents',
  },
};

export default async function ProgramHolderDocumentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Documents" }]} />
        </div>
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: requirements } = await supabase
    .from('document_requirements')
    .select('*')
    .eq('role', 'program_holder')
    .order('is_required', { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      styles[status as keyof typeof styles] ||
      'bg-slate-100 text-black border-slate-300'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Documents" }]} />
        </div>
      <section className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            My Documents
          </h1>
          <p className="text-lg text-black">
            Upload and manage your required documents
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">
              Upload New Document
            </h2>
            <Link
              href="/program-holder/documents/upload"
              className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </Link>
          </div>
          <p className="text-black">
            Upload required documents to complete your profile and maintain
            compliance.
          </p>
        </div>

        {requirements && requirements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Required Documents
            </h2>
            <div className="space-y-3">
              {requirements.map((req) => {
                const uploaded = documents?.find(
                  (d) => d.document_type === req.document_type
                );
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {uploaded ? (
                        getStatusIcon(uploaded.status)
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="font-semibold text-black">
                          {req.description}
                          {req.is_required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </h3>
                        <p className="text-sm text-black">
                          {req.instructions}
                        </p>
                      </div>
                    </div>
                    {uploaded && (
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-semibold border ${getStatusBadge(uploaded.status)}`}
                      >
                        {uploaded.status.charAt(0).toUpperCase() +
                          uploaded.status.slice(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-black mb-4">
            Uploaded Documents
          </h2>
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <h3 className="font-semibold text-black">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-black">
                        {doc.document_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                        • Uploaded{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Reason:</strong> {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-2 rounded-full text-xs font-semibold border ${getStatusBadge(doc.status)}`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 hover:underline text-sm font-semibold"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-black mb-4">No documents uploaded yet</p>
              <Link
                href="/program-holder/documents/upload"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Upload Your First Document
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
