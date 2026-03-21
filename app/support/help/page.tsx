import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Search, ArrowRight, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center | Elevate For Humanity',
  description: 'Browse our knowledge base for answers to common questions about enrollment, programs, funding, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/support/help',
  },
};

export const revalidate = 600;

const categories = [
  { name: 'Enrollment', slug: 'Enrollment', color: 'bg-brand-blue-100 text-brand-blue-600' },
  { name: 'Programs', slug: 'Programs', color: 'bg-brand-green-100 text-brand-green-600' },
  { name: 'Financial Aid', slug: 'Financial Aid', color: 'bg-brand-blue-100 text-brand-blue-600' },
  { name: 'Account', slug: 'Account', color: 'bg-brand-orange-100 text-brand-orange-600' },
  { name: 'Career Services', slug: 'Career Services', color: 'bg-teal-100 text-teal-600' },
  { name: 'General', slug: 'General', color: 'bg-white text-gray-600' },
];

async function getArticles(category?: string, search?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];
  
  let query = supabase
    .from('support_articles')
    .select('id, title, slug, excerpt, category, views')
    .eq('published', true)
    .order('views', { ascending: false });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  
  const { data: articles } = await query.limit(20);
  return articles || [];
}

export default async function HelpCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const articles = await getArticles(params.category, params.q);
  const activeCategory = params.category;
  const searchQuery = params.q;

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Support", href: "/support" }, { label: "Help" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-brand-blue-100 mb-8">
            Find answers to your questions
          </p>
          <form className="max-w-2xl mx-auto relative">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search help articles..."
              className="w-full px-6 py-4 rounded-full text-black text-lg focus:outline-none focus:ring-4 focus:ring-brand-blue-300"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 transition"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/support/help"
              className={`px-4 py-2 rounded-full font-medium transition ${
                !activeCategory
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Articles
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/support/help?category=${encodeURIComponent(cat.slug)}`}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  activeCategory === cat.slug
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          {searchQuery && (
            <p className="text-gray-600 mb-6">
              Showing results for "<span className="font-semibold">{searchQuery}</span>"
            </p>
          )}

          {articles.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-black mb-2">No articles found</h2>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? `We couldn't find any articles matching "${searchQuery}"`
                  : 'No articles in this category yet'}
              </p>
              <Link
                href="/support/ticket"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Submit a Support Ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/support/help/${article.slug}`}
                  className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-brand-blue-300 transition group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-2 text-xs font-medium rounded ${
                          categories.find(c => c.slug === article.category)?.color || 'bg-white text-gray-600'
                        }`}>
                          {article.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-black group-hover:text-brand-blue-600 transition mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Can't find what you're looking for?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support/ticket"
              className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Submit a Ticket
            </Link>
            <a
              href="/support"
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
