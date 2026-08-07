import { hero as heroTokens } from '@/lib/page-design-tokens';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import IntakeFormInner from './IntakeFormInner';
import ApplyPathGuide from '@/components/apply/ApplyPathGuide';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { getStaticProgram } from '@/data/programs/index';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import { loadApplyProgramOptions } from '@/lib/programs/public-program-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply | Career Training & Workforce Funding Intake',
  description:
    'Apply for Elevate career training. Verified WIOA/Workforce Ready Grant programs require WorkOne intake and authorization; other programs follow self-pay enrollment.',
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
              Career Training Application
            </p>
            {programTitle ? (
              <>
                <p className="text-slate-600 text-base mb-1">Applying for:</p>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 mb-4">{programTitle}</h1>
              </>
            ) : (
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 mb-4">
                Choose Your Training Path
              </h1>
            )}
            <p className="text-slate-700 text-lg sm:text-xl leading-relaxed max-w-2xl">
              Funded and self-pay programs follow different enrollment steps. Select your program below and the application will show the correct path.
            </p>
            <p className="mt-4 text-base text-slate-600">
              <Link href="/programs" className="text-brand-red-700 font-bold hover:underline">
                Browse all programs
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="application" className="py-12" aria-label="Application form">
        <div className="max-w-3xl mx-auto px-4">
          <ApplyPathGuide variant="hub" />
          <IntakeFormInner programs={programs} initialProgram={programSlug} />
        </div>
      </section>

      <ParisFloatingWrapper />
    </div>
  );
}
