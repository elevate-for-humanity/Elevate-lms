import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  FolderOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ category: string }>;
}

const categoryLabels: Record<string, string> = {
  contracts: 'Contracts & Agreements',
  policies: 'Policies & Procedures',
  templates: 'Document Templates',
  reports: 'Reports',
  compliance: 'Compliance Documents',
  training: 'Training Materials',
  hr: 'HR Documents',
  financial: 'Financial Documents',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${categoryLabels[category] || category} | Document Center | Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function DocumentCategoryPage({ params }: Props) {
  const { category } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch documents in this category
  const { data: documents, error } = await db
    .from('documents')
    .select(`
      *,
      profiles (first_name, last_name)
    `)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  const categoryLabel = categoryLabels[category] || category;

  // Group by subcategory if exists
  const groupedDocs = documents?.reduce((acc: Record<string, any[]>, doc) => {
    const subcat = doc.subcategory || 'General';
    if (!acc[subcat]) acc[subcat] = [];
    acc[subcat].push(doc);
    return acc;
  }, {}) || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-document-center-cat-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/document-center"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Document Center
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{categoryLabel}</h1>
            <p className="text-slate-600">
              {documents?.length || 0} document{documents?.length !== 1 ? 's' : ''} in this category
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Documents */}
      {documents && documents.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([subcategory, docs]) => (
            <div key={subcategory}>
              {Object.keys(groupedDocs).length > 1 && (
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-slate-500" />
                  {subcategory}
                </h2>
              )}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Document</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Uploaded By</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Size</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc: any) => (
                      <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-brand-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{doc.name}</p>
                              <p className="text-sm text-slate-500">{doc.file_type || 'PDF'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              {doc.profiles ? `${doc.profiles.first_name} ${doc.profiles.last_name}` : 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={doc.url}
                              download
                              className="p-2 text-slate-600 hover:text-brand-green-600 hover:bg-brand-green-50 rounded-lg"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              className="p-2 text-slate-600 hover:text-brand-red-600 hover:bg-brand-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Documents</h2>
          <p className="text-slate-600 mb-6">
            There are no documents in this category yet.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
            <Upload className="w-4 h-4" />
            Upload First Document
          </button>
        </div>
      )}
    </div>
  );
}
