import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Folder, File, Upload, Search, Grid, List } from 'lucide-react';

export const metadata: Metadata = {
  title: 'File Manager | Elevate For Humanity',
  description: 'Manage your documents, certificates, and course materials.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/file-manager',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FileManagerPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/file-manager');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'File Manager' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search files..." className="pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Upload className="w-5 h-5" /> Upload
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { name: 'Documents', count: 12, icon: Folder, color: 'blue' },
            { name: 'Certificates', count: 3, icon: Folder, color: 'green' },
            { name: 'Course Materials', count: 8, icon: Folder, color: 'blue' },
            { name: 'Submissions', count: 5, icon: Folder, color: 'orange' },
          ].map((folder, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md cursor-pointer">
              <folder.icon className={`w-10 h-10 text-${folder.color}-600 mb-3`} />
              <h3 className="font-semibold text-gray-900">{folder.name}</h3>
              <p className="text-gray-500 text-sm">{folder.count} files</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Files</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white rounded"><Grid className="w-5 h-5 text-gray-600" /></button>
              <button className="p-2 hover:bg-white rounded"><List className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          <div className="p-8 text-center">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No recent files</p>
            <button className="mt-4 text-brand-blue-600 hover:underline">Upload your first file</button>
          </div>
        </div>
      </div>
    </div>
  );
}
