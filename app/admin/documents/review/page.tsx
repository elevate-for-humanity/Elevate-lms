import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review Documents | Admin',
  description: 'Review and approve uploaded documents',
};

export default async function AdminDocumentReviewPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    (profile.role !== 'admin' && profile.role !== 'super_admin')
  ) {
    redirect('/unauthorized');
  }

  // Get all documents with user info
  const { data: documents } = await supabase
    .from('documents')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        role
      )
    `
    )
    .order('created_at', { ascending: false });

  const pendingDocs = documents?.filter((d) => d.status === 'pending') || [];
  const approvedDocs = documents?.filter((d) => d.status === 'approved') || [];
  const rejectedDocs = documents?.filter((d) => d.status === 'rejected') || [];

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
      {/* Header */}
      <section className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Document Review
              </h1>
              <p className="text-lg text-black">
                Review and approve uploaded documents
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {documents?.length || 0}
              </span>
            </div>
            <div className="text-sm text-black">Total Documents</div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-900">
                {pendingDocs.length}
              </span>
            </div>
            <div className="text-sm text-yellow-900 font-semibold">
              Pending Review
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-black">
                {approvedDocs.length}
              </span>
            </div>
            <div className="text-sm text-black">Approved</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-black">
                {rejectedDocs.length}
              </span>
            </div>
            <div className="text-sm text-black">Rejected</div>
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
                    {getStatusIcon(doc.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-black">
                        {doc.document_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                        •{(doc.profiles as any)?.full_name || 'Unknown User'} (
                        {(doc.profiles as any)?.role}) • Uploaded{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/documents/review/${doc.id}`}
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
          <h2 className="text-2xl font-bold text-black mb-4">
            All Documents
          </h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button className="px-4 py-2 font-semibold text-brand-blue-600 border-b-2 border-brand-blue-600" aria-label="Action button">
              All ({documents?.length || 0})
            </button>
            <button className="px-4 py-2 font-semibold text-black hover:text-black" aria-label="Action button">
              Pending ({pendingDocs.length})
            </button>
            <button className="px-4 py-2 font-semibold text-black hover:text-black" aria-label="Action button">
              Approved ({approvedDocs.length})
            </button>
            <button className="px-4 py-2 font-semibold text-black hover:text-black" aria-label="Action button">
              Rejected ({rejectedDocs.length})
            </button>
          </div>

          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-black">
                        {doc.document_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                        •{(doc.profiles as any)?.full_name || 'Unknown User'} (
                        {(doc.profiles as any)?.role}) • Uploaded{' '}
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
                    <Link
                      href={`/admin/documents/review/${doc.id}`}
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
