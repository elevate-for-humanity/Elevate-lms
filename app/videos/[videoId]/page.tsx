import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { videos, getVideoById } from '../../../lms-data/videos';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return videos.map((video) => ({
    videoId: video.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const video = getVideoById(videoId);

  if (!video) {
    return {
      title: 'Video Not Found',
    };
  }

  return {
    title: `${video.title} | Elevate for Humanity`,
    description: video.description,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/videos/${video.id}`,
    },
    openGraph: {
      title: video.title,
      description: video.description,
      url: `https://www.elevateforhumanity.org/videos/${video.id}`,
      type: 'video.other',
      images: [
        {
          url: video.thumbnailUrl,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
      videos: [
        {
          url: `https://www.elevateforhumanity.org${video.videoUrl}`,
          width: 1280,
          height: 720,
          type: 'video/mp4',
        },
      ],
    },
  };
}

export default async function VideoWatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Try database first
  const { data: dbVideo } = await db
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  const video = dbVideo || getVideoById(videoId);

  if (!video) {
    notFound();
  }

  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: `https://www.elevateforhumanity.org${video.thumbnailUrl}`,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: `https://www.elevateforhumanity.org${video.videoUrl}`,
    embedUrl: `https://www.elevateforhumanity.org${video.videoUrl}`,
    publisher: {
      '@type': 'Organization',
      name: 'Elevate for Humanity',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.elevateforhumanity.org/logo.png',
      },
    },
  };

  return (
    <>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Videos", href: "/videos" }, { label: "[Videoid]" }]} />
      </div>
<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />

      <div className="min-h-screen bg-white">
        {/* Back Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-black hover:text-black transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Videos
            </Link>
          </div>
        </div>

        {/* Video Player */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
            <video
              controls
              preload="none"
              poster={video.thumbnailUrl}
              className="w-full aspect-video"
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="mt-8 bg-white rounded-lg p-8 shadow-sm">
            <div className="mb-4">
              <span className="inline-block px-3 py-2 bg-brand-orange-100 text-brand-orange-800 rounded-full text-sm font-semibold">
                {video.category}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {video.title}
            </h1>
            <p className="text-lg text-black leading-relaxed">
              {video.description}
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold rounded-lg transition"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-white text-black font-bold rounded-lg border-2 border-gray-300 transition"
              >
                View Programs
              </Link>
            </div>
          </div>

          {/* Related Videos */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-black mb-6">
              More Videos
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {videos
                .filter((v) => v.id !== video.id)
                .slice(0, 3)
                .map((relatedVideo) => (
                  <Link
                    key={relatedVideo.id}
                    href={`/videos/${relatedVideo.id}`}
                    className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition"
                  >
                    <div className="relative aspect-video bg-gray-200">
                      <Image
                        src={relatedVideo.thumbnailUrl}
                        alt={relatedVideo.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-black mb-2 line-clamp-2">
                        {relatedVideo.title}
                      </h3>
                      <p className="text-sm text-black line-clamp-2">
                        {relatedVideo.description}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
