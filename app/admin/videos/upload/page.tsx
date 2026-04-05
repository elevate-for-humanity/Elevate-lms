import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VideoUploadClient from './VideoUploadClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/videos/upload' },
  title: 'Upload Videos | Elevate For Humanity',
  description: 'Upload video content for courses and training materials.',
};

export default async function UploadVideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-videos-upload-hero.jpg" alt="Upload videos" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/videos" className="hover:text-primary">Videos</Link></li><li>/</li><li className="text-gray-900 font-medium">Upload</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Upload Videos</h1>
          <p className="text-gray-600 mt-2">Upload video files to the course library. After uploading, copy the URL and paste it into a lesson.</p>
        </div>
        <VideoUploadClient />
      </div>
    </div>
  );
}
