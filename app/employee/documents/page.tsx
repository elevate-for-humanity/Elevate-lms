import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Upload, Folder, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Documents | Employee Portal',
  description: 'Access and manage your employee documents.',
};

export const dynamic = 'force-dynamic';

export default async function EmployeeDocumentsPage() {
  const supabase = await createClient();
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employee/documents');
  }

  // Get employee documents
  const { data: documents } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get document categories
  const { data: categories } = await supabase
    .from('document_categories')
    .select('*')
    .eq('type', 'employee')
    .order('name', { ascending: true });

  const defaultCategories = [
    { id: 'tax', name: 'Tax Documents', count: 0 },
    { id: 'benefits', name: 'Benefits', count: 0 },
    { id: 'policies', name: 'Policies', count: 0 },
    { id: 'personal', name: 'Personal', count: 0 },
  ];

  const displayCategories = categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Employee Portal', href: '/employee' },
          { label: 'Documents' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Documents</h1>
            <p className="text-gray-600">Access and manage your employee documents</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <nav className="space-y-2">
                <Link
                  href="/employee/documents"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-blue-50 text-brand-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    All Documents
                  </span>
                  <span className="text-sm">{documents?.length || 0}</span>
                </Link>
                {displayCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/employee/documents?category=${category.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-600 hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {category.name}
                    </span>
                    <span className="text-sm">{category.count || 0}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border">
              {documents && documents.length > 0 ? (
                <div className="divide-y">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 hover:bg-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FileText className="w-10 h-10 text-brand-blue-500" />
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.category} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        download
                        className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
