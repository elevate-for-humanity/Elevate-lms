import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  buildProgramsListingMetadata,
  getPublicProgramsPageData,
} from '@/lib/programs/public-programs-page';
import { WORKONE_INDY_INTAKE_URL } from '@/lib/programs/funding-registry';
import { ProgramsExplorer } from './ProgramsExplorer';
import { HomeProgramShowcase } from '@/components/home/HomeProgramShowcase';
import { buildGuidedNarration } from '@/lib/narration/guided-script';

const PROGRAMS_NARRATION = buildGuidedNarration({
  welcome: "Let's choose a program by starting with the work you want to do, not by trying to read every card on this page.",
  concept:
    'A career-training program teaches a focused set of job skills. An apprenticeship adds paid, supervised workplace learning. That difference matters because it changes your schedule, enrollment steps, and how you practice.',
  example:
    'Imagine you want a hands-on trade. HVAC or commercial driving may fit a training-first path. Barbering or cosmetology may fit an apprenticeship if you want to learn inside an approved shop or salon.',
  reflection:
    'Pause here and picture the workday you want. Do you see yourself on a job site, on the road, in an office, or serving clients in a shop?',
  nextStep:
    'Open the one program closest to that goal. Review its schedule and requirements, then apply. If the program shows workforce funding, schedule WorkOne intake before training begins. Elevate will help you with the next step after your application.',
});

// Cache the public catalog briefly so every visit does not block on a fresh database query.\n// Published changes still reach the page within one minute.\nexport const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildProgramsListingMetadata();
}

export default async function ProgramsPage() {
  const { programs } = await getPublicProgramsPageData();
  const isApprenticeship = (program: (typeof programs)[number]) =>
    program.category.toLowerCase().includes('apprenticeship') ||
    program.slug.includes('apprenticeship') ||
    program.title.toLowerCase().includes('apprenticeship');
  const apprenticeships = programs.filter(isApprenticeship);
  const careerTraining = programs.filter((program) => !isApprenticeship(program));
  const funded = careerTraining.filter((program) => program.funding_tier === 'workforce-funded');
  const selfPay = careerTraining.filter((program) => program.funding_tier === 'self-pay');

  return (
    <main className="min-h-screen bg-white">
      <div
        data-scroll-narration
        data-narration={PROGRAMS_NARRATION}
        data-narration-rate="0.82"
        data-narration-style="instructor"
      >
        <HomeProgramShowcase asHero />
      </div>

      <section id="program-catalog" className="scroll-mt-24 border-b border-emerald-200 bg-emerald-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-emerald-800">Verified Workforce-Funding Pathways</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Programs with evidence supporting a public funding label</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">WorkOne or the responsible agency determines participant eligibility, covered costs, current availability, and written authorization. A program listing is not a funding award.</p>
            </div>
            <a href={WORKONE_INDY_INTAKE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-extrabold text-white hover:bg-emerald-800">Schedule WorkOne Intake <ArrowRight className="h-4 w-4" /></a>
          </div>
          {funded.length > 0 ? <ProgramsExplorer programs={funded} /> : <p className="mt-8 rounded-xl bg-white p-6 text-slate-700">No programs are currently published in the verified funded registry.</p>}
        </div>
      </section>

      <section className="border-b border-blue-200 bg-blue-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-widest text-brand-blue-800">Earn While You Learn</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Registered apprenticeships are a separate pathway</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">Apprenticeships combine related instruction with paid, supervised work at an approved employer or Host Site. Program participation may be no-cost to eligible apprentices, but employment, placement, funding, and enrollment approval must be confirmed before training begins.</p>
            </div>
            <Link href="/apprenticeships" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-800 px-6 py-3.5 text-base font-extrabold text-white hover:bg-brand-blue-900">How Apprenticeships Work <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {apprenticeships.length > 0 ? <ProgramsExplorer programs={apprenticeships} variant="apprenticeship" /> : <p className="mt-8 rounded-xl bg-white p-6 text-slate-700">View the apprenticeship directory for current occupations and application steps.</p>}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">Regular Courses</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Self-pay and payment-plan programs</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">These are career-training courses with pay-in-full, installment, employer-sponsored, or Buy Now Pay Later options. BNPL requires separate provider approval and is not the same as free workforce funding.</p>
          </div>
          <ProgramsExplorer programs={selfPay} />
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-orange-300" />
          <h2 className="mt-4 text-3xl font-black">Not sure which program fits?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">Start with your career goal and funding situation. The application routes you to the applicable program and next-step workflow without promising funding.</p>
          <Link href="/apply" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 text-lg font-extrabold text-white hover:bg-brand-red-700">Start Application <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>
    </main>
  );
}
