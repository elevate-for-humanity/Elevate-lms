import { hero as heroTokens } from '@/lib/page-design-tokens';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ClipboardCheck, MessageCircle, ArrowRight } from 'lucide-react';
import IntakeFormInner from './IntakeFormInner';
import ApplyPathGuide from '@/components/apply/ApplyPathGuide';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { getStaticProgram } from '@/data/programs/index';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import { loadApplyProgramOptions } from '@/lib/programs/public-program-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment Application | Career Training & Workforce Funding Intake',
  description:
    'Start an Elevate enrollment application. Verified WIOA/Workforce Ready Grant programs require WorkOne intake and authorization; other programs follow self-pay enrollment.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const programSlug = normalizeProgramInterest(params?.program) ?? '';
  const staticProg = programSlug ? getStaticProgram(programSlug) : null;
  const programTitle = staticProg?.title
    ?? (programSlug
      ? programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  const { options: programs } = await loadApplyProgramOptions();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
          <span className="font-bold text-slate-900">Applying as:</span>
          <span className="font-bold text-brand-red-600">Student / Participant</span>
          <Link href="/apply/employer" className="text-slate-600 hover:text-slate-900">Employer</Link>
          <Link href="/apply/program-holder" className="text-slate-600 hover:text-slate-900">Training Provider</Link>
        </div>
      </div>

      <section className="relative w-full">
        <div className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
          <Image
            src="/images/pages/apply-hero.webp"
            alt="Students exploring career training programs at Elevate for Humanity"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            placeholder="empty"
          />
        </div>
        <div className="bg-white border-b border-slate-200 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red-600 mb-3">
              Enrollment Application
            </p>
            {programTitle ? (
              <>
                <p className="text-slate-600 text-base mb-1">Applying to enroll in:</p>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 mb-4">{programTitle}</h1>
              </>
            ) : (
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 mb-4">
                Start Your Enrollment Application
              </h1>
            )}
            <p className="text-slate-700 text-lg sm:text-xl leading-relaxed max-w-2xl">
              This form starts the admissions and enrollment process. Funded and self-pay programs follow different next steps.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-slate-50 border-b border-slate-200" aria-label="Choose inquiry or enrollment">
        <div className="max-w-3xl mx-auto px-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-brand-red-200 bg-white p-5">
            <ClipboardCheck className="h-7 w-7 text-brand-red-700 mb-3" />
            <h2 className="text-xl font-extrabold text-slate-950">I am ready to enroll</h2>
            <p className="mt-2 text-base text-slate-700">Continue below. This creates an application and moves you into admissions, funding/self-pay review, onboarding, and enrollment steps.</p>
          </div>
          <Link href={`/program-inquiry${programSlug ? `?program=${encodeURIComponent(programSlug)}` : ''}`} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-sky-300 hover:shadow-md transition-all">
            <MessageCircle className="h-7 w-7 text-sky-700 mb-3" />
            <h2 className="text-xl font-extrabold text-slate-950">I only have questions</h2>
            <p className="mt-2 text-base text-slate-700">Send a program inquiry instead. No application, funding request, seat reservation, or enrollment record is created.</p>
            <span className="mt-4 inline-flex items-center gap-2 font-bold text-sky-700">Go to Program Inquiry <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <section id="application" className="py-12" aria-label="Enrollment application form">
        <div className="max-w-3xl mx-auto px-4">
          <ApplyPathGuide variant="hub" />
          <IntakeFormInner programs={programs} initialProgram={programSlug} />
        </div>
      </section>

      <ParisFloatingWrapper />
    </div>
  );
}
