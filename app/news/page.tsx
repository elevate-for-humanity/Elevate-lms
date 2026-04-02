import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag, ArrowRight, Newspaper } from 'lucide-react';
import { getPublishedPosts, getFeaturedPost, getCategories, formatPostDate } from '@/lib/data/news';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'News & Updates | Elevate for Humanity',
  description: 'Latest news, program updates, success stories, and announcements from Elevate for Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/news' },
};

export default async function NewsPage() {
  const [featured, posts, categories] = await Promise.all([
    getFeaturedPost(),
    getPublishedPosts({ limit: 18 }),
    getCategories(),
  ]);

  // Remaining posts excluding featured
  const rest = featured ? posts.filter(p => p.id !== featured.id) : posts;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden">
        <Image
          src="/images/pages/success-stories-hero.jpg"
          alt="Elevate for Humanity news and updates"
          fill className="object-cover" priority
         sizes="100vw" />
        
        <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-300 mb-1">Elevate for Humanity</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">News &amp; Updates</h1>
          <p className="text-slate-600 mt-1 text-sm max-w-xl">
            Program announcements, success stories, and workforce development news from Indianapolis.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'News' }]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-8 text-center">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No articles published yet.</p>
            <p className="text-slate-500 text-sm mt-1">Follow us on social media for the latest updates.</p>
            <Link href="/contact" className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline font-medium">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main column */}
            <div className="flex-1 min-w-0">
              {/* Featured post */}
              {featured && (
                <Link href={`/news/${featured.slug}`} className="group block mb-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[16/7] overflow-hidden bg-white">
                    {featured.featured_image ? (
                      <Image src={featured.featured_image} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500"  sizes="100vw" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-600 to-brand-blue-800 flex items-center justify-center">
                        <Newspaper className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                                        <div className="absolute inset-x-6 bottom-6 text-white">
                      {featured.category && (
                        <span className="inline-block bg-brand-blue-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                          {featured.category}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl font-bold leading-snug">{featured.title}</h2>
                      {featured.excerpt && <p className="text-slate-600 text-sm mt-1 line-clamp-2">{featured.excerpt}</p>}
                      <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatPostDate(featured.published_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Article grid */}
              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {rest.map(post => (
                    <Link key={post.id} href={`/news/${post.slug}`} className="group block rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="relative aspect-[16/9] bg-white overflow-hidden">
                        {post.featured_image ? (
                          <Image src={post.featured_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500"  sizes="100vw" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <Newspaper className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {post.category && (
                          <span className="text-[11px] font-semibold text-brand-blue-600 uppercase tracking-wide">{post.category}</span>
                        )}
                        <h3 className="font-bold text-slate-900 mt-1 leading-snug group-hover:text-brand-blue-700 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p>}
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatPostDate(post.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
              {categories.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 text-xs font-medium bg-white text-slate-700 px-3 py-1.5 rounded-full">
                        <Tag className="w-3 h-3" /> {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-brand-blue-50 border border-brand-blue-100 p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">Stay informed</h3>
                <p className="text-xs text-slate-600 mb-3">Get program updates and workforce news delivered to your inbox.</p>
                <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-700 hover:underline">
                  Subscribe <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Quick links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/programs" className="text-brand-blue-600 hover:underline">Browse Programs</Link></li>
                  <li><Link href="/events" className="text-brand-blue-600 hover:underline">Upcoming Events</Link></li>
                  <li><Link href="/about" className="text-brand-blue-600 hover:underline">About Elevate</Link></li>
                  <li><Link href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</Link></li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
