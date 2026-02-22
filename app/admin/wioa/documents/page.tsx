import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Upload, Download, Search, Filter, Folder, File, Eye, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WIOA Documents | Admin',
  description: 'Manage WIOA participant documentation.',
  robots: { index: false, follow: false },
};

export default async function WIOADocumentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch WIOA documents
  const { data: documents } = await db
    .from('wioa_documents')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  const allDocs = documents || [];

  // Calculate folder counts
  const folders = [
    { name: 'Eligibility Forms', count: allDocs.filter(d => d.document_type === 'eligibility').length },
    { name: 'Income Verification', count: allDocs.filter(d => d.document_type === 'income').length },
    { name: 'Training Agreements', count: allDocs.filter(d => d.document_type === 'training').length },
    { name: 'Outcome Documentation', count: allDocs.filter(d => d.document_type === 'outcome').length },
    { name: 'Support Services', count: allDocs.filter(d => d.document_type === 'support').length },
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Documents" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        <Link href="/admin/wioa" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to WIOA Management
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WIOA Documents</h1>
            <p className="text-gray-600">Manage participant documentation and compliance files</p>
          </div>
          <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Folders</h3>
              <div className="space-y-2">
                {folders.map((folder, index) => (
                  <button key={index} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-700">{folder.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{folder.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              {allDocs.length === 0 ? (
                <div className="p-12 text-center">
                  <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                  <p className="text-gray-600 mb-6">Upload WIOA participant documents to get started.</p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
                    <Plus className="w-4 h-4" />
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {allDocs.map((doc) => {
                    const profile = doc.profiles as { first_name: string; last_name: string } | null;
                    return (
                      <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.file_name || doc.title}</p>
                          <p className="text-sm text-gray-500">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'} - {doc.document_type}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'verified' ? 'bg-brand-green-100 text-brand-green-700' :
                          doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-brand-red-100 text-brand-red-700'
                        }`}>
                          {doc.status || 'pending'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                            <Trash2 className="w-4 h-4 text-brand-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
