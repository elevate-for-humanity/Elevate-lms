import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/files' },
  title: 'My Files | Elevate For Humanity',
  description: 'Access your course files and materials.',
};

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: files } = await supabase.from('user_files').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Files</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">My Files</h1><p className="text-gray-600 mt-2">Course materials and downloads</p></div>
            <Link href="/lms/files" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Upload File</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {files && files.length > 0 ? files.map((file: any) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded flex items-center justify-center"><svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <div><p className="font-medium">{file.filename}</p><p className="text-sm text-gray-500">{file.file_size || 'N/A'} • {new Date(file.created_at).toLocaleDateString()}</p></div>
                </div>
                {file.file_url
                  ? <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">Download</a>
                  : <span className="text-gray-300 text-sm cursor-not-allowed">Unavailable</span>
                }
              </div>
            )) : <div className="p-8 text-center text-gray-500">No files yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
