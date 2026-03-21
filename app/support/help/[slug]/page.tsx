import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ArrowLeft, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';

export const revalidate = 600;

type Params = Promise<{ slug: string }>;

async function getArticle(slug: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;
  
  const { data: article, error } = await supabase
    .from('support_articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  
  if (error || !article) return null;
  
  // Increment views
  await supabase
    .from('support_articles')
    .update({ views: (article.views || 0) + 1 })
    .eq('id', article.id);
  
  return article;
}

async function getRelatedArticles(category: string, currentSlug: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];
  
  const { data: articles } = await supabase
    .from('support_articles')
    .select('title, slug, excerpt')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(3);
  
  return articles || [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return { title: 'Article Not Found | Elevate For Humanity' };
  }
  
  return {
    title: `${article.title} | Help Center | Elevate For Humanity`,
    description: article.excerpt,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/support/help/${slug}`,
    },
  };
}

export default async function HelpArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    notFound();
  }
  
  const relatedArticles = await getRelatedArticles(article.category, slug);

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Support", href: "/support" }, { label: "[Slug]" }]} />
      </div>
{/* Header */}
      <section className="border-b py-6">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href="/support/help"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-2 bg-brand-blue-100 text-brand-blue-600 text-sm font-medium rounded-full">
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              {article.views || 0} views
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-black">{article.title}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-700 prose-a:text-brand-blue-600 prose-strong:text-black prose-li:text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(formatContent(article.content)) }}
            />
            
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Related topics:</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-2 bg-white text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-700 mb-4">Was this article helpful?</p>
              <div className="flex justify-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-green-100 text-brand-green-700 rounded-lg hover:bg-brand-green-200 transition font-medium">
                  <ThumbsUp className="w-5 h-5" />
                  Yes, helpful
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                  <ThumbsDown className="w-5 h-5" />
                  Not helpful
                </button>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-black mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedArticles.map((related: any) => (
                  <Link
                    key={related.slug}
                    href={`/support/help/${related.slug}`}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-brand-blue-300 transition group"
                  >
                    <h3 className="font-semibold text-black group-hover:text-brand-blue-600 transition line-clamp-2">
                      {related.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Still need help */}
          <div className="mt-12 p-8 bg-brand-blue-50 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-black mb-2">Still need help?</h2>
            <p className="text-gray-600 mb-6">
              Our support team is ready to assist you.
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
                className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white transition border border-gray-200"
              >
                (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatContent(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-12 mb-6">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-blue-600 hover:underline">$1</a>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">');
}
