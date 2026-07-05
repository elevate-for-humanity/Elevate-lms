import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { blogPosts, blogCategories } from '@/content/blog';

export const metadata: Metadata = {
  title: `Blog | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Workforce training insights, funding guides, career advice, and success stories from Elevate for Humanity.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Blog</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Insights on workforce training, career development, and funding opportunities
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="px-4 py-2 bg-brand-red-600 text-white text-sm font-semibold rounded-full"
            >
              All Posts
            </Link>
            {blogCategories.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${cat}`}
                className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-full border border-slate-200 hover:border-brand-red-500 hover:text-brand-red-600 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-brand-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 w-fit">
                  Featured
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                  {blogPosts[0]?.title || 'Latest Insights'}
                </h2>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {blogPosts[0]?.summary || ''}
                </p>
                <div className="flex items-center gap-4 text-slate-400 text-sm mb-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {blogPosts[0]?.date || ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {blogPosts[0]?.author || ''}
                  </span>
                </div>
                <Link
                  href={`/blog/${blogPosts[0]?.slug || ''}`}
                  className="inline-flex items-center gap-2 text-brand-red-400 font-semibold hover:text-brand-red-300 transition-colors"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative min-h-[300px] bg-slate-700">
                <Image
                  src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/blog-featured.webp"
                  alt={blogPosts[0]?.title || 'Blog featured image'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">All Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-100"
              >
                <div className="aspect-video bg-slate-100 relative">
                  <Image
                    src={`https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/blog-${i + 1}.webp`}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {post.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span>{post.author}</span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-brand-red-600 font-semibold text-sm hover:text-brand-red-700"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Stay Updated</h2>
          <p className="text-slate-600 mb-8">
            Get the latest workforce training insights and funding guides delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
