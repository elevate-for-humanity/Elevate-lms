import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Search, Filter, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses Help | Elevate Support',
  description: 'Find help with courses, enrollments, and training programs.',
};

export default function HelpCoursesPage() {
  const topics = [
    { title: 'How to Enroll in a Course', href: '/programs' },
    { title: 'Finding Your Course Materials', href: '/training/learning-center' },
    { title: 'Course Completion Requirements', href: '/programs' },
    { title: 'Getting Your Certificate', href: '/credentials' },
    { title: 'Transferring Credits', href: '/contact' },
    { title: 'Course Schedules', href: '/programs' },
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
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Course Help
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Find answers to common questions about courses, enrollments, and training programs.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for help topics..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-red-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Common Topics</h2>
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all"
              >
                <span className="font-medium text-slate-900">{topic.title}</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Still Need Help?</h2>
          <p className="text-slate-600 mb-8">Our support team is here to help with any questions about your courses.</p>
          <Link href="/support/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
