import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllLiveVideos, getAllCategories } from '@/lib/video/registry';
import { Play } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Training Videos',
  description:
    'Watch verified career training videos about Elevate programs and how to get started.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/videos',
  },
};

export default async function VideosPage() {
  const videos = getAllLiveVideos();
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Videos' }]} />
        </div>
      </div>

      <section className="bg-brand-blue-700 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">Training Videos</h1>
          <p className="mx-auto max-w-3xl text-xl text-white">
            Watch verified production videos about our programs and enrollment pathways.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {categories.map((category) => {
            const categoryVideos = videos.filter((video) => video.category === category);

            return (
              <div key={category} className="mb-16">
                <h2 className="mb-8 text-3xl font-bold text-black">{category}</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {categoryVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/videos/${video.id}`}
                      className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-xl"
                    >
                      <div className="relative aspect-video bg-slate-200">
                        <Image
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
                          src={video.thumbnail_url}
                          alt={video.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition group-hover:scale-110">
                            <Play className="ml-1 h-8 w-8 text-brand-orange-600" />
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="mb-3 line-clamp-2 text-xl font-bold text-slate-900">
                          {video.title}
                        </h3>
                        <p className="line-clamp-3 text-slate-700">{video.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-black">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-black">
            Apply for career training and complete the eligibility process for available funding.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/start"
              className="inline-flex items-center justify-center rounded-lg bg-brand-orange-600 px-8 py-4 font-bold text-white transition hover:bg-brand-orange-700"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-8 py-4 font-bold text-black transition"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
