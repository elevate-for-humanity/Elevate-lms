import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Courses Help | Elevate Support',
  description: 'Find help with courses, enrollments, credentials, schedules, and training programs.',
};

export default function HelpCoursesPage() {
  const topics = [
    { title: 'How to Apply for Training', href: '/apply/student' },
    { title: 'Find Your Program', href: '/programs' },
    { title: 'Learning Resources', href: '/training/learning-center' },
    { title: 'Testing & Credentials', href: '/testing' },
    { title: 'Funding Options', href: '/funding' },
    { title: 'Contact Support', href: '/support/contact' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/pathways-page-11.webp"
        alt="Learner reviewing course and support resources"
        eyebrow="Help Center"
        title="Course Help"
        description="Use the links below to reach the real application, program, learning, testing, funding, and support resources."
        actions={(
          <Link href="/support/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Contact Support</Link>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-slate-950">Common Topics</h2>
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Link key={topic.title} href={topic.href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-blue-200 hover:shadow-md">
                <span className="font-semibold text-slate-900">{topic.title}</span>
                <ArrowRight className="h-5 w-5 text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Still Need Help?</h2>
          <p className="mb-8 text-slate-700">Contact support if you cannot find the course or enrollment information you need.</p>
          <Link href="/support/contact" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Contact Support</Link>
        </div>
      </section>
    </div>
  );
}
