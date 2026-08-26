export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Newspaper, Plus, Search, Calendar, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Press & Media | Elevate Admin',
  description: 'Manage press releases and media coverage.',
};

export default async function PressPage() {
  const db = await requireAdminClient();

  const { data: pressItems } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .in('category', ['press', 'media', 'Press', 'Media'])
    .order('published_at', { ascending: false })
    .limit(12);

  const { data: recentNews } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(6);

  const posts = pressItems && pressItems.length > 0 ? pressItems : (recentNews ?? []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Press & Media</h1>
              <p className="text-sm text-slate-500 mt-1">Manage press releases and news coverage</p>
            </div>
            <Link
              href="/blog/management"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Press Release
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {post.featured_image && (
                    <div className="relative h-48 bg-slate-100">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover" sizes="100vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Calendar className="w-3 h-3" />
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Unpublished'}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{post.category}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Press Releases</h3>
              <p className="text-sm text-slate-500 mb-6">Create your first press release to share news with media.</p>
              <Link
                href="/blog/management"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Press Release
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}