import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Search, ChevronRight, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Help Center | Elevate for Humanity',
  description: 'Find answers to your questions about enrollment, courses, funding, certifications, and more. Browse our help articles or contact support.',
  keywords: ['help center', 'FAQ', 'support', 'enrollment help', 'funding', 'course help'],
  alternates: {
    canonical: `${SITE_URL}/help/articles`,
  },
  openGraph: {
    title: 'Help Center | Elevate for Humanity',
    description: 'Find answers to your questions about enrollment, courses, funding, and more.',
    url: `${SITE_URL}/help/articles`,
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Help Center | Elevate for Humanity',
    description: 'Find answers to your questions about enrollment, courses, and funding.',
  },
};

export default async function HelpArticlesPage() {
  let categories: any[] = [];
  let popularArticles: any[] = [];
  
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase) {
      const { data: catData } = await db
        .from('help_categories')
        .select('name, slug, article_count')
        .eq('is_active', true)
        .order('sort_order');
      
      categories = catData || [];

      const { data: artData } = await db
        .from('help_articles')
        .select('id, title, slug, view_count, category')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);
      
      popularArticles = artData || [];
    }
  } catch (err) {
    console.error('Failed to fetch help data:', err);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Help', href: '/help' }, { label: 'Articles' }]} />
        </div>
      </div>

      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/help-page-1.jpg"
          alt="Help Center"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.slug} 
                  href={`/help/articles/${category.slug}`} 
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.article_count} articles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {popularArticles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/help/articles/article/${article.slug || article.id}`} 
                  className="block p-4 hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{article.category}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {article.view_count?.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 bg-brand-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-brand-blue-900 mb-2">Can&apos;t find what you need?</h3>
              <p className="text-sm text-brand-blue-700 mb-4">Our support team is here to help.</p>
              <Link href="/contact" className="inline-block bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
