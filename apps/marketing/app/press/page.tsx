import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, Newspaper, Mail, Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { formatPostDate } from '@/lib/data/news';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Press & Media | Elevate for Humanity',
  description:
    'Press coverage, media resources, and contact information for journalists covering Elevate for Humanity workforce development programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/press' },
};

export default async function PressPage() {
  const db = await requireAdminClient();

  // Press-specific posts (category = 'press' or 'media')
  const { data: pressItems } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .in('category', ['press', 'media', 'Press', 'Media'])
    .order('published_at', { ascending: false })
    .limit(12);

  // Recent news as fallback if no press-tagged posts
  const { data: recentNews } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(6);

  const posts = pressItems && pressItems.length > 0 ? pressItems : (recentNews ?? []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Press' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            Media Center
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Press &amp; Media</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Resources for journalists, media professionals, and partners covering workforce
            development in Indiana.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-10">
        {/* Main: press coverage */}
        <main className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {pressItems && pressItems.length > 0 ? 'Press Coverage' : 'Recent News'}
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-16 px-8 text-center">
              <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No press items published yet.</p>
              <p className="text-slate-500 text-sm mt-1">
                For media inquiries, contact us directly.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="group block rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {post.featured_image && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <span className="text-[11px] font-semibold text-brand-red-600 uppercase tracking-wide">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 mt-1 leading-snug group-hover:text-brand-red-700 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatPostDate(post.published_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red-600 hover:underline"
            >
              View all news <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>

        {/* Sidebar: media kit + contact */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-1">Media Inquiries</h3>
            <p className="text-sm text-slate-600 mb-4">
              For interviews, quotes, or press requests, contact our communications team.
            </p>
            <a
              href="mailto:press@elevateforhumanity.org"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <Mail className="w-4 h-4" /> press@elevateforhumanity.org
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-1">Media Kit</h3>
            <p className="text-sm text-slate-600 mb-4">
              Logos, brand guidelines, leadership bios, and program fact sheets.
            </p>
            <a
              href="mailto:press@elevateforhumanity.org?subject=Media%20Kit%20Request"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" /> Request Media Kit
            </a>
          </div>

          <div className="rounded-xl bg-brand-red-50 border border-brand-red-100 p-6">
            <h3 className="font-bold text-slate-900 mb-2">Fast Facts</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• DOL Registered Apprenticeship Sponsor</li>
              <li>• Indiana ETPL Certified Provider</li>
              <li>• WIOA / WRG / JRI Approved</li>
              <li>• SAM.gov Registered (CAGE: 0Q856)</li>
              <li>• ByBlack Certified Business</li>
              <li>• NRF Rise Up Provider</li>
              <li>• Certiport CATC Testing Center</li>
            </ul>
            <Link
              href="/about"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-red-700 hover:underline"
            >
              About Elevate <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3">Social &amp; Video</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/reels"
                  className="text-brand-red-600 hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Watch our Reels
                </Link>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/elevateforhumanity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-red-600 hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@elevateforhumanity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-red-600 hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> TikTok
                </a>
              </li>
              <li>
                <Link
                  href="/share"
                  className="text-brand-red-600 hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Share with someone
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
