import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Upload } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Documents | Apprentice Portal',
  description: 'Access your apprenticeship documents and forms.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeDocumentsPage() {
  const supabase = await createClient();
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/documents');
  }

  // Get apprentice profile
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get documents
  const { data: documents } = await supabase
    .from('apprentice_documents')
    .select('*')
    .eq('apprentice_id', apprentice?.id)
    .order('created_at', { ascending: false });

  // Get required forms
  const { data: requiredForms } = await supabase
    .from('apprentice_forms')
    .select('*')
    .eq('program_id', apprentice?.program_id)
    .eq('is_required', true);

  const defaultDocuments = [
    { id: 1, name: 'Apprenticeship Agreement', category: 'Contracts', created_at: new Date().toISOString() },
    { id: 2, name: 'Training Plan', category: 'Training', created_at: new Date().toISOString() },
    { id: 3, name: 'Safety Certification', category: 'Certifications', created_at: new Date().toISOString() },
  ];

  const displayDocuments = documents && documents.length > 0 ? documents : defaultDocuments;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'Documents' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-gray-600">Access your apprenticeship documents and forms</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Documents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">My Documents</h2>
              </div>
              {displayDocuments.length > 0 ? (
                <div className="divide-y">
                  {displayDocuments.map((doc: any) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
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
                        href={doc.url || '#'}
                        download
                        className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                      >
                        <Download className="w-5 h-5" />
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Required Forms</h3>
              {requiredForms && requiredForms.length > 0 ? (
                <ul className="space-y-3">
                  {requiredForms.map((form: any) => (
                    <li key={form.id}>
                      <a
                        href={form.url || '#'}
                        className="flex items-center gap-2 text-brand-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        {form.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No forms available yet.</p>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/apprentice/handbook" className="text-brand-blue-600 hover:underline">
                    Apprentice Handbook
                  </Link>
                </li>
                <li>
                  <Link href="/apprentice/hours" className="text-brand-blue-600 hover:underline">
                    Log Hours
                  </Link>
                </li>
                <li>
                  <Link href="/apprentice/transfer-hours" className="text-brand-blue-600 hover:underline">
                    Transfer Hours
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
