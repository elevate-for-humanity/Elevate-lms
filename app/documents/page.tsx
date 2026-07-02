import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { DynamicPDFViewer } from '@/lib/dynamic-imports';
import { FileText, Lock, Clock, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documents | Elevate for Humanity',
  description: 'View and manage your documents',
};

export const dynamic = 'force-dynamic';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  bucket: string;
  storage_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expires_at?: string;
}

export default async function DocumentsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  // Fetch user's documents from various tables
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch employer documents if user is an employer
  const { data: employerDocs } = await supabase
    .from('employer_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch enrollment documents
  const { data: enrollmentDocs } = await supabase
    .from('enrollment_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Combine all documents
  const allDocuments: Document[] = [
    ...(documents || []).map(d => ({
      id: d.id,
      title: d.name || d.title || 'Document',
      description: d.description,
      file_url: d.file_url || '',
      bucket: 'documents',
      storage_path: d.file_path || '',
      status: d.status || 'pending',
      created_at: d.created_at,
      expires_at: d.expires_at,
    })),
    ...(employerDocs || []).map(d => ({
      id: d.id,
      title: d.name || d.title || 'Employer Document',
      description: d.description,
      file_url: d.file_url || '',
      bucket: 'documents',
      storage_path: d.file_path || '',
      status: d.status || 'pending',
      created_at: d.created_at,
      expires_at: d.expires_at,
    })),
    ...(enrollmentDocs || []).map(d => ({
      id: d.id,
      title: d.name || d.title || 'Enrollment Document',
      description: d.description,
      file_url: d.file_url || '',
      bucket: 'documents',
      storage_path: d.storage_path || '',
      status: d.status || 'pending',
      created_at: d.created_at,
      expires_at: d.expires_at,
    })),
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-brand-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        </div>

        {allDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Documents Yet</h2>
            <p className="text-gray-600">
              Documents will appear here once they are uploaded or shared with you.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {allDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-6 h-6 text-slate-400 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                    {doc.expires_at && (
                      <span>Expires {new Date(doc.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {doc.file_url && (
                  <div className="border-t border-slate-100">
                    <DynamicPDFViewer
                      url={doc.file_url}
                      title={doc.title}
                      showDownload
                      showPagination={false}
                      className="rounded-none border-0"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
