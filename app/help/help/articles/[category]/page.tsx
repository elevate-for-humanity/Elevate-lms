
import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Help Articles | Elevate LMS' };

interface Props {
  params: Promise<{ category: string }>;
}

export default async function HelpCategoryPage({ params }: Props) {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('help_articles').select('*').limit(50);

  const { category } = await params;
  const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const articles = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Help', href: '/help' },
          { label: 'Articles', href: '/help/articles' },
          { label: categoryName },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{categoryName}</h1>
        <p className="text-slate-700 mb-8">{articles.length} articles in this category</p>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {articles.map((article) => (
            <Link key={article.id} href={`/help/articles/article/${article.id}`} className="flex items-center justify-between p-6 hover:bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{article.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-700 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {article.readTime} read</span>
                    <span>Updated {article.updated}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
