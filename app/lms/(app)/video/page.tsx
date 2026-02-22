import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LiveStreamingClassroom } from '@/components/LiveStreamingClassroom';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/video' },
  title: 'Video Library | Elevate For Humanity',
  description: 'Access video-based learning content.',
};

export default async function VideoPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: videos } = await db.from('videos').select('*').order('created_at', { ascending: false }).limit(12);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Video</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
          <p className="text-gray-600 mt-2">Watch instructional videos and tutorials</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos && videos.length > 0 ? videos.map((video: any) => (
            <div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md">
              <div className="aspect-video bg-gray-900 flex items-center justify-center"><svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <div className="p-4">
                <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-500">{video.duration || '0:00'}</p>
              </div>
            </div>
          )) : <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">No videos available</div>}
        </div>

        {/* Live Streaming Classroom */}
        <div className="mt-12">
          <LiveStreamingClassroom sessionId="live-session" />
        </div>
      </div>
    </div>
  );
}
