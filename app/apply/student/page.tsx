import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import StudentApplicationForm from './StudentApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Student Application | Elevate for Humanity',
  description: 'Apply for workforce training and career development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
  openGraph: {
    title: 'Apply for Free Career Training | Elevate for Humanity',
    description: 'Apply for workforce training and career development programs. Most students begin training within 2-4 weeks.',
    url: 'https://www.elevateforhumanity.org/apply/student',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/pages/comp-home-highlight-health.jpg', width: 1200, height: 630, alt: 'Apply for career training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply for Free Career Training | Elevate for Humanity',
    description: 'Apply for workforce training programs. Most students begin within 2-4 weeks.',
    images: ['/images/pages/comp-home-highlight-health.jpg'],
  },
};

export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — standard height, no text overlay */}
      <div className="relative h-[45vh] min-h-[280px] max-h-[560px] overflow-hidden">
        <Image src="/images/pages/apply-page-4.jpg" alt="Student application — Elevate for Humanity" fill sizes="100vw" className="object-cover" priority />
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Student' }]} />
        </div>
      </div>

      {/* Page identity */}
      <section className="border-b border-slate-100 bg-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Student Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Start Your Career Journey
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">
            This application helps us understand your goals and match you with the right
            training program. Many programs have funding available through WIOA, WRG, and JRI grants.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <StudentApplicationForm initialProgram={initialProgram} />
      </section>

      {/* Other application types */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-slate-600 text-sm mb-3">Not a student?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply/employer" className="text-brand-blue-600 hover:underline font-medium text-sm">
              Employer Partnership
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/apply/program-holder" className="text-brand-blue-600 hover:underline font-medium text-sm">
              Become a Program Holder
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/apply/staff" className="text-brand-blue-600 hover:underline font-medium text-sm">
              Staff Application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
