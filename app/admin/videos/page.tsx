import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Video, Upload, Play, Eye } from 'lucide-react';

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
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Videos" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch videos data
  const { data: videos, count: totalVideos } = await supabase
    .from('videos')
    .select(
      `
      *,
      course:courses(name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: publishedVideos } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Videos" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[280px] md:h-[350px] lg:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/lms-analytics.jpg"
          alt="Videos Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Videos Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage video content, course videos, and multimedia learning
            materials
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/videos/upload"
              className="bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              Upload Video
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
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
                          />
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
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through Elevate for
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
