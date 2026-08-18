import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { LiveStreamingClassroom } from '@/components/LiveStreamingClassroom';
import { getAllLiveVideos } from '@/lib/video/registry';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/video' },
  title: 'Video Library',
  description: 'Access verified video-based learning and program content.',
};

export default async function VideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const videos = getAllLiveVideos();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li>
              <li>/</li>
              <li className="font-medium text-slate-900">Video</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Video Library</h1>
          <p className="mt-2 text-slate-700">Verified production videos available in the platform.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-video bg-slate-900">
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 transition group-hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 text-brand-blue-700" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h2 className="mb-1 line-clamp-2 font-bold text-slate-950">{video.title}</h2>
                <p className="text-sm font-semibold text-slate-600">{video.category}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <LiveStreamingClassroom sessionId="live-session" />
        </div>
      </div>
    </div>
  );
}
