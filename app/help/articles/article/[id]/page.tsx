import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ThumbsUp, ThumbsDown, Share2, Printer } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = { title: 'Help Article | Elevate LMS' };

export default function HelpArticlePage({ params }: { params: { id: string } }) {
  const article = {
    id: params.id,
    title: 'How to enroll in a program',
    category: 'Getting Started',
    readTime: '5 min',
    updated: 'January 15, 2026',
    content: `
      <h2>Overview</h2>
      <p>Enrolling in a program at Elevate is a straightforward process. This guide will walk you through each step to get you started on your learning journey.</p>
      
      <h2>Step 1: Browse Programs</h2>
      <p>Visit our Programs page to explore all available training programs. You can filter by category, duration, or career field to find the right fit for you.</p>
      
      <h2>Step 2: Review Program Details</h2>
      <p>Click on any program to view detailed information including:</p>
      <ul>
        <li>Curriculum and course content</li>
        <li>Duration and schedule options</li>
        <li>Tuition and payment options</li>
        <li>Career outcomes and job placement rates</li>
      </ul>
      
      <h2>Step 3: Start Your Application</h2>
      <p>Click the "Apply Now" button on the program page. You'll need to provide:</p>
      <ul>
        <li>Personal information</li>
        <li>Educational background</li>
        <li>Career goals</li>
      </ul>
      
      <h2>Step 4: Complete Enrollment</h2>
      <p>After your application is approved, you'll receive instructions to complete enrollment, including payment setup and orientation scheduling.</p>
    `,
  };

  const relatedArticles = [
    { id: '2', title: 'Understanding tuition and payment options' },
    { id: '3', title: 'Financial aid and scholarships' },
    { id: '4', title: 'What to expect on your first day' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Help', href: '/help' },
          { label: 'Articles', href: '/help/articles' },
          { label: article.title },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="mb-6">
            <span className="text-sm text-brand-blue-600 font-medium">{article.category}</span>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {article.readTime} read</span>
              <span>Last updated: {article.updated}</span>
            </div>
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
          <div className="mt-8 pt-8 border-t">
            <p className="text-gray-700 mb-4">Was this article helpful?</p>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ThumbsUp className="w-5 h-5" /> Yes
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ThumbsDown className="w-5 h-5" /> No
              </button>
              <div className="flex-1"></div>
              <button className="p-2 text-gray-600 hover:text-brand-blue-600"><Share2 className="w-5 h-5" /></button>
              <button className="p-2 text-gray-600 hover:text-brand-blue-600"><Printer className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Articles</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {relatedArticles.map((related) => (
              <Link key={related.id} href={`/help/articles/article/${related.id}`} className="block p-4 hover:bg-gray-50">
                <span className="text-brand-blue-600 hover:underline">{related.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
