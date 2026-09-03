import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, BookOpen, MessageCircle } from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface HelpCategoryConfig {
  categorySlug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  relatedCategories?: { label: string; href: string }[];
}

interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  read_time_minutes: number | null;
  is_featured: boolean;
  view_count: number;
}

export async function HelpCategoryPage({ config }: { config: HelpCategoryConfig }) {
  const db = await requireAdminClient();

  const { data: articles, error } = await db
    .from('help_articles')
    .select('id, slug, title, excerpt, content, read_time_minutes, is_featured, view_count')
    .eq('category_slug', config.categorySlug)
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('view_count', { ascending: false });

  const items: HelpArticle[] = articles ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Help Center
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-blue-50 flex items-center justify-center flex-shrink-0 text-brand-blue-600">
              {config.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
              <p className="text-slate-500 mt-1">{config.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Help articles temporarily unavailable.</p>
            <Link
              href="/help"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline"
            >
              Back to Help Center
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">No articles yet</p>
            <p className="text-slate-500 text-sm mb-4">
              Articles for this topic are being written. Check back soon.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline"
            >
              Browse all help topics
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((article) => (
              <Link
                key={article.id}
                href={`/help/articles/${article.slug}`}
                className="block bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-brand-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.is_featured && (
                        <span className="text-xs font-semibold bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                      <h2 className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue-700 transition-colors">
                        {article.title}
                      </h2>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      {article.read_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.read_time_minutes} min read
                        </span>
                      )}
                      {article.view_count > 0 && (
                        <span>{article.view_count.toLocaleString()} views</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 flex-shrink-0 mt-0.5 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Related categories */}
        {config.relatedCategories && config.relatedCategories.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Related Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {config.relatedCategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact support */}
        <div className="mt-10 bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Still need help?</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Our support team is available Monday–Friday, 8am–6pm ET.
            </p>
            <Link
              href="/contact"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue-600 hover:underline"
            >
              Contact support <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
