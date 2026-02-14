import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/curriculum/upload' },
  title: 'Upload Curriculum | Elevate For Humanity',
  description: 'Upload and manage curriculum content and materials.',
};

export default async function UploadCurriculumPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Upload Curriculum</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Upload Curriculum</h1>
          <p className="text-gray-600 mt-2">Import curriculum content from files</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-gray-500">Supports: PDF, DOCX, XLSX, SCORM packages</p>
            <button className="mt-4 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Select Files</button>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3">Upload Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                <span className="text-sm">Auto-create course structure from content</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm">Extract quiz questions from documents</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
