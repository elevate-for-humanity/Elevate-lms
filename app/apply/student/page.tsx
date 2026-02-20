import { Metadata } from 'next';
import Image from 'next/image';
import StudentApplicationForm from './StudentApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';

import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

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
    images: [{ url: '/images/heroes-hq/success-hero.jpg', width: 1200, height: 630, alt: 'Apply for career training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply for Free Career Training | Elevate for Humanity',
    description: 'Apply for workforce training programs. Most students begin within 2-4 weeks.',
    images: ['/images/heroes-hq/success-hero.jpg'],
  },
};

export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('applications').select('*').limit(50);

  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[260px]">
        <Image src="/images/heroes-hq/success-hero.jpg" alt="Student application" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded">
          <span className="text-sm font-bold text-slate-900">Elevate for Humanity</span>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Student' }]} />
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase mb-2">
            Student Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Start Your Career Journey
          </h1>
          <p className="text-base sm:text-lg text-black max-w-3xl">
            This application helps us understand your goals and match you with the right
            training program. Many programs have funding available through WIOA, WRG, and JRI grants.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <StudentApplicationForm initialProgram={initialProgram} />
      </section>
    </div>
  );
}
