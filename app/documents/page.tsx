import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText, Download, Eye, Search, FolderOpen, File, Upload } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documents | Elevate For Humanity',
  description: 'Access your documents and resources.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/documents',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const getFileIcon = (type: string) => {
  if (type?.includes('pdf')) return 'text-red-500';
  if (type?.includes('doc')) return 'text-blue-500';
  if (type?.includes('sheet') || type?.includes('excel')) return 'text-green-500';
  if (type?.includes('image')) return 'text-blue-500';
  return 'text-gray-500';
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/documents');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Fetch user's documents
  const { data: userDocuments } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch shared/public documents based on role
  const { data: sharedDocuments } = await supabase
    .from('documents')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // Combine and dedupe
  const allDocuments = [...(userDocuments || []), ...(sharedDocuments || [])];
  const uniqueDocuments = allDocuments.filter((doc, index, self) =>
    index === self.findIndex(d => d.id === doc.id)
  );

  // Group by category
  const categories = ['All', ...new Set(uniqueDocuments.map(d => d.category || 'Uncategorized'))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Documents</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
            <p className="text-gray-600">Access forms, guides, and resources</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.slice(0, 6).map(cat => (
              <button key={cat}
                className="px-4 py-2 rounded-lg text-sm whitespace-nowrap bg-white border hover:bg-gray-50">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Document</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {uniqueDocuments.length > 0 ? (
                uniqueDocuments.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${getFileIcon(doc.mime_type)}`} />
                        <div>
                          <p className="font-medium">{doc.name || doc.filename}</p>
                          <p className="text-sm text-gray-500 uppercase">{doc.mime_type?.split('/')[1] || 'file'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">{doc.category || 'General'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {doc.url && (
                          <>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded" title="Preview">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </a>
                            <a href={doc.url} download
                              className="p-2 hover:bg-gray-100 rounded" title="Download">
                              <Download className="w-4 h-4 text-gray-500" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">No documents yet</p>
                    <p className="text-sm text-gray-500">Upload documents or check back later</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
