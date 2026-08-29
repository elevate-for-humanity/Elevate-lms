import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Play, Clock, BookOpen, Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tutorials,
  description: 'Step-by-step video tutorials to help you navigate the Elevate platform.',
};

const tutorials = [
  { title: 'Getting Started with Elevate', duration: '5 min', category: 'Basics', href: '/help/tutorials' },
  { title: 'Completing Your Application', duration: '8 min', category: 'Application', href: '/help/tutorials' },
  { title: 'Navigating Your Dashboard', duration: '6 min', category: 'Dashboard', href: '/help/tutorials' },
  { title: 'Submitting Assignments', duration: '7 min', category: 'Coursework', href: '/help/tutorials' },
  { title: 'Using the AI Tutor', duration: '4 min', category: 'AI Tools', href: '/help/tutorials' },
  { title: 'Accessing Career Services', duration: '5 min', category: 'Career', href: '/help/tutorials' },
  { title: 'Payment & Billing', duration: '6 min', category: 'Billing', href: '/help/tutorials' },
  { title: 'Mobile App Tutorial', duration: '5 min', category: 'Mobile', href: '/help/tutorials' },
];

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Help', href: '/help' }, { label: 'Tutorials' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Video Tutorials</h1>
          <p className="text-blue-100">Step-by-step guides to help you navigate the Elevate platform.</p>
        </div>
      </section>

      {/* Tutorials Grid */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorials.map((tutorial) => (
              <Link key={tutorial.title} href={tutorial.href} className="group bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue-600 transition-colors">
                    <Play className="w-6 h-6 text-brand-blue-600 group-hover:text-white transition-colors" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 bg-brand-blue-50 text-brand-blue-700 text-xs font-medium rounded mb-2">{tutorial.category}</span>
                    <h3 className="text-lg font-bold text-black group-hover:text-brand-blue-700 transition-colors">{tutorial.title}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>{tutorial.duration}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* More Help */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-black mb-4">Need More Help?</h2>
          <p className="text-slate-600 mb-6">Our support team can walk you through any feature.</p>
          <Link href="/support/contact" className="inline-block bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
