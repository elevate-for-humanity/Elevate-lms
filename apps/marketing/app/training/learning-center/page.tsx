import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Video, FileText, Headphones, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Learning Center | Training Resources',
  keywords: ["learning center", "resources", "guides", "tutorials", "learning"],
  description: 'Access training resources, tutorials, guides, and videos to support your learning journey.',
};

export default function TrainingLearningCenterPage() {
  const resources = [
    { icon: Video, title: 'Video Tutorials', count: 45, desc: 'Step-by-step video guides for common tasks and procedures.' },
    { icon: FileText, title: 'Guides & Docs', count: 28, desc: 'Comprehensive documentation and how-to guides.' },
    { icon: Headphones, title: 'Support Articles', count: 62, desc: 'Helpful articles answering common questions.' },
    { icon: BookOpen, title: 'Course Materials', count: 15, desc: 'Supplementary materials for training programs.' },
  ];

  const popular = [
    { title: 'Getting Started with Your LMS', views: '2.4k views' },
    { title: 'How to Submit Your Application', views: '1.8k views' },
    { title: 'Understanding WIOA Funding', views: '1.5k views' },
    { title: 'Resume Building Best Practices', views: '1.2k views' },
    { title: 'Interview Preparation Guide', views: '980 views' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Learning Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Learning Resources
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Access tutorials, guides, and resources to support your training journey. Everything you need to succeed, all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/programs" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Start Learning
              </Link>
              <Link href="/support/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Get Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">Resource Categories</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Browse our collection of learning resources.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((r) => (
              <div key={r.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-200 transition-all">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <r.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{r.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{r.count} resources</p>
                <p className="text-sm text-slate-600 mb-4">{r.desc}</p>
                <Link href="#" className="text-sm text-brand-blue-600 font-semibold inline-flex items-center gap-1 hover:text-brand-blue-700">
                  Browse <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Resources */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Popular Resources</h2>
          <div className="space-y-4">
            {popular.map((item, index) => (
              <Link key={index} href="#" className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-300">{index + 1}</span>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.views}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need More Help?</h2>
          <p className="text-slate-600 mb-8">Our support team is here to help you succeed.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/support/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Support
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
