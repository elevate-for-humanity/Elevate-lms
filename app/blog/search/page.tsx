import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Blog | Elevate For Humanity',
  description:
    'Search our blog for workforce development insights, success stories, and career tips.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/blog/search',
  },
};

async function searchBlogPosts(query: string) {
  if (!query) return [];

  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
    const { data: posts } = await db
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`
      )
      .order('published_at', { ascending: false })
      .limit(20);

    return posts || [];
  } catch (error) { /* Error handled silently */ 
    return [];
  }
}

export default async function BlogSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';
  const results = query ? await searchBlogPosts(query) : [];

  return (
    <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: "Search" }]} />
      </div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-4 text-2xl md:text-3xl lg:text-4xl">
            Search Blog
          </h1>

          {/* Search Form */}
          <form method="GET" action="/blog/search" className="max-w-2xl">
            <div className="relative">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search articles..."
                className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div className="mb-6">
            <p className="text-black">
              {results.length > 0
                ? `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
                : `No results found for "${query}"`}
            </p>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {post.featured_image && (
                  <div className="relative h-48">
                    <Image
                      loading="lazy"
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.category && (
                    <span className="inline-block px-3 py-2 bg-brand-blue-100 text-brand-blue-800 text-sm font-semibold rounded-full mb-3">
                      {post.category}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-black mb-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-brand-blue-600"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-black mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                    {post.author && <span>By {post.author}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* No Query State */}
        {!query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-black text-lg">
              Enter a search term to find blog posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
