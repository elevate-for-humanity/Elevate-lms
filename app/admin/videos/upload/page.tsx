import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/videos/upload' },
  title: 'Upload Videos | Elevate For Humanity',
  description: 'Upload video content for courses and training materials.',
};

export default async function UploadVideosPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/videos" className="hover:text-primary">Videos</Link></li><li>/</li><li className="text-gray-900 font-medium">Upload</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Upload Videos</h1>
          <p className="text-gray-600 mt-2">Add video content to your course library</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="text-gray-600 mb-2">Drag and drop video files here</p>
            <p className="text-sm text-gray-500">MP4, WebM, MOV up to 2GB</p>
            <button className="mt-4 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Select Files</button>
          </div>
        </div>
      </div>
    </div>
  );
}
