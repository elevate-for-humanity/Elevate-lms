import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Video, FileText, Headphones, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Learning Center | Training Resources',
  keywords: ['learning center', 'resources', 'guides', 'tutorials', 'learning'],
  description: 'Access training resources, program information, funding guidance, career support, and help resources.',
};

export default function TrainingLearningCenterPage() {
  const resources = [
    { icon: Video, title: 'Program & Course Learning', desc: 'Open training programs and learner resources.', href: '/programs' },
    { icon: FileText, title: 'Application Guidance', desc: 'Start the complete student application and review the enrollment process.', href: '/apply/student' },
    { icon: Headphones, title: 'Support', desc: 'Get help with enrollment, accounts, payments, and technical questions.', href: '/support/contact' },
    { icon: BookOpen, title: 'Career Resources', desc: 'Resume, job-placement, and professional-development support.', href: '/career-services' },
  ];

  const guides = [
    { title: 'Start a Training Application', href: '/apply/student' },
    { title: 'Explore Funding Options', href: '/funding' },
    { title: 'Resume Building', href: '/career-services/resume-building' },
    { title: 'Job Placement Support', href: '/career-services/job-placement' },
    { title: 'Testing & Certifications', href: '/testing' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/higher-ed-hero.webp"
        alt="Learners using education and training resources"
        eyebrow="Learning Center"
        title="Learning Resources"
        description="Use the Learning Center to reach the real program, funding, application, career-services, and support resources across the Elevate platform."
        actions={(
          <>
            <Link href="/programs" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Explore Programs</Link>
            <Link href="/support/contact" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Get Support</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Resource Categories</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-700">Each card links to an active platform resource—no placeholder links.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((r) => (
              <Link key={r.title} href={r.href} className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-blue-200 hover:shadow-lg">
                <r.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-2 font-bold text-slate-950">{r.title}</h3>
                <p className="mb-4 text-sm text-slate-700">{r.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-700">Open <ArrowRight className="h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-slate-950">Frequently Used Resources</h2>
          <div className="space-y-4">
            {guides.map((item, index) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-blue-200 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-300">{index + 1}</span>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Need More Help?</h2>
          <p className="mb-8 text-slate-700">Use the support page if you cannot find the resource or next step you need.</p>
          <Link href="/support/contact" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Contact Support</Link>
        </div>
      </section>
    </div>
  );
}
