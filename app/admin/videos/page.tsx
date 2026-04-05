import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { Video, Upload, Play, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/videos',
  },
  title: 'Videos Management | Elevate For Humanity',
  description:
    'Manage video content, course videos, and multimedia learning materials.',
};

export default async function VideosPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: videos, error } = await db
    .from('videos')
    .select('id, title, description, url, video_url, thumbnail_url, duration_seconds, published, category, created_at')
    .order('created_at', { ascending: false });

  const rows = videos ?? [];
  const totalVideos = rows.length;
  const publishedVideos = rows.filter((v: any) => v.published).length;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Videos" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-videos-hero.jpg"
          alt="Videos Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Video className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Videos
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalVideos || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Play className="h-11 w-11 text-brand-green-600" />
                  <h3 className="text-sm font-medium text-black">
                    Published
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {publishedVideos || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Views
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {videos?.reduce((acc, v) => acc + (v.view_count || 0), 0) ||
                    0}
                </p>
              </div>
            </div>

            {/* Videos List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Videos</h2>
                <Link
                  href="/admin/videos/upload"
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Video
                </Link>
              </div>
              {videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {video.thumbnail_url ? (
                        <div className="relative h-48 bg-gray-200">
                          <Image
                            src={video.thumbnail_url}
                            alt={video.title}
                            fill
                            className="object-cover"
                           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          <Video className="h-12 w-12 text-black" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{video.title}</h3>
                        <p className="text-sm text-black mb-2">
                          {video.course?.name || 'No course assigned'}
                        </p>
                        <div className="flex justify-between items-center text-xs text-black">
                          <span>{video.duration || '0:00'}</span>
                          <span>{video.view_count || 0} views</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/admin/videos/${video.id}`}
                            className="flex-1 text-center bg-brand-blue-100 text-brand-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-brand-blue-200"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/videos/${video.slug}`}
                            className="flex-1 text-center bg-gray-100 text-black px-3 py-2 rounded text-sm font-medium hover:bg-gray-200"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-black text-lg">No videos found</p>
                  <p className="text-black text-sm mt-2">
                    Upload your first video to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Video Management
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Upload, organize, and embed training videos.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/videos"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Videos
              </Link>
              <Link
                href="/admin/media-studio"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Media Studio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
