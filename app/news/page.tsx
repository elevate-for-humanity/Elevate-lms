import { Metadata } from 'next';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Newspaper, Calendar, ArrowRight, Tag,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'News | Elevate For Humanity',
  description: 'Latest news, updates, and announcements from Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/news',
  },
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
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

  const { data: articles } = await db
    .from('news_articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(12);

  const { data: categories } = await db
    .from('news_categories')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'News' }]} />
        </div>
      </div>

      <div className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Updates</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Stay informed about our programs, partnerships, and community impact.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href="/news" className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-medium">
              All News
            </Link>
            {categories.map((cat: any) => (
              <Link key={cat.id} href={`/news?category=${cat.slug}`} className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles && articles.length > 0 ? articles.map((article: any) => (
            <article key={article.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition">
              {article.image_url && (
                <div className="h-48 bg-gray-200 relative">
                  <Image src={article.image_url} alt={article.title} fill quality={85} className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <h2 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                {article.category && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <Tag className="w-3 h-3" />
                    {article.category}
                  </div>
                )}
                <Link href={`/news/${article.slug}`} className="inline-flex items-center gap-1 text-slate-700 font-medium hover:underline">
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          )) : (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border">
              <Newspaper className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No News Articles Yet</h3>
              <p className="text-gray-600">Check back soon for updates!</p>
            </div>
          )}
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
