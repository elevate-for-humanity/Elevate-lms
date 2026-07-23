import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Clock, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Workforce development insights, career tips, and stories from Elevate for Humanity.',
};

const posts = [
  { title: 'How WIOA Funding Can Cover Your Training Costs', date: '2024-01-15', excerpt: 'Learn how Workforce Innovation and Opportunity Act funding can pay for your workforce training entirely.' },
  { title: 'From Unemployed to Employed: Maria\'s Story', date: '2024-01-10', excerpt: 'Maria went from working minimum wage to a certified medical assistant making $18/hour.' },
  { title: 'Why Apprenticeships Are Making a Comeback', date: '2024-01-05', excerpt: 'DOL-registered apprenticeships offer earn-while-you-learn benefits for both workers and employers.' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100">Insights, stories, and resources for your career journey.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <article key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">{post.title}</h2>
                  <p className="text-slate-600 text-sm mb-4">{post.excerpt}</p>
                  <Link href="#" className="text-brand-blue-600 font-semibold hover:underline">Read More →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
