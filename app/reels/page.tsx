import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ArrowRight, Newspaper } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import ReelsFeed from '@/components/reels/ReelsFeed';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Reels',
  description:
    `Short-form videos about career training, success stories, and workforce development from ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/reels' },
};

export default async function ReelsPage() {
  const db = await requireAdminClient();

  const { data: reels } = await db
    .from('reels')
    .select('id, title, description, video_url, thumbnail_url, likes, views')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // Pull recent blog posts to cross-link
  const { data: posts } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(4);

  const feedReels = (reels ?? []).map((r) => ({
    id: r.id,
    video_url: r.video_url ?? '',
    title: r.title ?? '',
    description: r.description ?? '',
    likes: r.likes ?? 0,
    views: r.views ?? 0,
  }));

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Blog', href: '/news' }, { label: 'Reels' }]} />
      </div>

      <ReelsFeed reels={feedReels} />

      {/* Cross-link to blog posts */}
      {posts && posts.length > 0 && (
        <section className="bg-slate-900 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-brand-red-400" /> From the Blog
              </h2>
              <Link
                href="/news"
                className="text-sm text-brand-red-400 hover:underline flex items-center gap-1"
              >
                All posts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="block rounded-xl bg-slate-800 border border-slate-700 p-4 hover:bg-slate-750 hover:border-slate-600 transition"
                >
                  <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social follow + CTA */}
      <section className="bg-brand-blue-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Follow Us for More</h2>
          <p className="text-blue-100 mb-6">
            New reels, success stories, and program updates posted weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="https://www.instagram.com/elevateforhumanity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Follow on Instagram
            </a>
            <a
              href="https://www.tiktok.com/@elevateforhumanity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              Follow on TikTok
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Apply Now
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
