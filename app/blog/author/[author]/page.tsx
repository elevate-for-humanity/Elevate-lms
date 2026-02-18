import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author: authorSlug } = await params;
  const author = authorSlug.replace(/-/g, ' ');
  return {
    title: `Articles by ${author} | Elevate For Humanity`,
    description: `Read articles written by ${author}`,
  };
}

async function getAuthorPosts(author: string) {
  try {
    const supabase = await createClient();

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
    const authorName = author.replace(/-/g, ' ');

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .ilike('author', authorName)
      .order('published_at', { ascending: false });

    return posts || [];
  } catch (error) { /* Error handled silently */ 
    return [];
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author } = await params;
  const posts = await getAuthorPosts(author);
  const authorName = author.replace(/-/g, ' ');

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: "[Author]" }]} />
      </div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Author Header */}
        <div className="mb-12 text-center">
          <div className="w-24 h-24    rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
            {authorName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <h1 className="text-4xl font-bold text-black mb-2 capitalize text-2xl md:text-3xl lg:text-4xl">
            {authorName}
          </h1>
          <p className="text-black">
            {posts.length} article{posts.length === 1 ? '' : 's'} published
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
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
                <div className="text-sm text-slate-500">
                  {new Date(post.published_at).toLocaleDateString()}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
