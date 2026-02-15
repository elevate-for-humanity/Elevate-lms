import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = { title: 'Help Articles | Elevate LMS' };

interface Props {
  params: Promise<{ category: string }>;
}

export default async function HelpCategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const articles = [
    { id: '1', title: 'How to create your account', readTime: '3 min', updated: 'Jan 15, 2026' },
    { id: '2', title: 'Setting up your profile', readTime: '2 min', updated: 'Jan 10, 2026' },
    { id: '3', title: 'Navigating the dashboard', readTime: '4 min', updated: 'Jan 8, 2026' },
    { id: '4', title: 'Understanding your learning path', readTime: '5 min', updated: 'Jan 5, 2026' },
    { id: '5', title: 'Tracking your progress', readTime: '3 min', updated: 'Jan 3, 2026' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Help', href: '/help' },
          { label: 'Articles', href: '/help/articles' },
          { label: categoryName },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
        <p className="text-gray-600 mb-8">{articles.length} articles in this category</p>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {articles.map((article) => (
            <Link key={article.id} href={`/help/articles/article/${article.id}`} className="flex items-center justify-between p-6 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{article.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {article.readTime} read</span>
                    <span>Updated {article.updated}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
