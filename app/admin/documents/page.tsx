import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/documents' },
  title: 'Document Center | Elevate For Humanity',
  description: 'Manage documents and files in the document center.',
};

export default async function DocumentsPage() {
  // Auth check via session client
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  // Use admin client to bypass RLS and see all documents
  const supabase = createAdminClient();
  const { data: documents, count } = await supabase.from('documents').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Documents</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Document Center</h1><p className="text-gray-600 mt-2">{count || 0} documents</p></div>
            <div className="flex gap-3">
              <Link href="/admin/documents/templates" className="bg-white text-brand-blue-600 border border-brand-blue-600 px-4 py-2 rounded-lg hover:bg-brand-blue-50 font-medium">Templates</Link>
              <Link href="/admin/documents/upload" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Upload Document</Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {documents && documents.length > 0 ? documents.map((doc: any) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded flex items-center justify-center"><svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <div><p className="font-medium">{doc.title || doc.file_name || doc.filename}</p><p className="text-sm text-gray-500">{doc.document_type || doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}</p></div>
                </div>
                <button className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">Download</button>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No documents uploaded</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
