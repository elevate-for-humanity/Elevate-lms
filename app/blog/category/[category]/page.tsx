import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = categorySlug.replace(/-/g, ' ');
  return {
    title: `${category} | Blog | Elevate For Humanity`,
    description: `Browse ${category} articles from Elevate For Humanity`,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/blog/category/${categorySlug}`,
    },
  };
}

async function getCategoryPosts(category: string) {
  try {
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
    const categoryName = category.replace(/-/g, ' ');

    const { data: posts } = await db
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .ilike('category', categoryName)
      .order('published_at', { ascending: false });

    return posts || [];
  } catch (error) { /* Error handled silently */ 
    return [];
  }
}

async function getAllCategories() {
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: posts } = await db
      .from('blog_posts')
      .select('category')
      .eq('published', true)
      .not('category', 'is', null);

    const categories = [
      ...new Set(posts?.map((p) => p.category).filter(Boolean)),
    ];
    return categories;
  } catch (error) { /* Error handled silently */ 
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const posts = await getCategoryPosts(category);
  const allCategories = await getAllCategories();
  const categoryName = category.replace(/-/g, ' ');

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: "[Category]" }]} />
      </div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <nav
            role="navigation"
            aria-label="Main navigation"
            className="text-sm text-black mb-4"
          >
            <Link
              href="/blog"
              aria-label="Link"
              className="hover:text-brand-blue-600"
            >
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-black font-semibold capitalize">
              {categoryName}
            </span>
          </nav>
          <h1 className="text-4xl font-bold text-black mb-4 capitalize text-2xl md:text-3xl lg:text-4xl">
            {categoryName}
          </h1>
          <p className="text-black">
            {posts.length} article{posts.length === 1 ? '' : 's'} in this
            category
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {post.featured_image && (
                    <div className="relative h-48 overflow-hidden">
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
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h3 className="font-bold text-black mb-4">Categories</h3>
              <ul className="space-y-2">
                {allCategories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/blog/category/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`block px-3 py-2 rounded hover:bg-white transition-colors ${
                        cat.toLowerCase() === categoryName.toLowerCase()
                          ? 'bg-brand-blue-100 text-brand-blue-800 font-semibold'
                          : 'text-black'
                      }`}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
