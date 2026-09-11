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

// Cache the public catalog briefly so every visit does not block on a fresh database query.\n// Published changes still reach the page within one minute.\nexport const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildProgramsListingMetadata();
}

export default async function ProgramsPage() {
  const { programs } = await getPublicProgramsPageData();
  const funded = programs.filter((program) => program.funding_tier === 'workforce-funded');
  const selfPay = programs.filter((program) => program.funding_tier === 'self-pay');

  return (
    <main className="min-h-screen bg-white">
      <div
        data-scroll-narration
        data-narration="Explore Elevate career programs built for real employment opportunities. Train for HVAC and skilled trades, commercial driving, business and entrepreneurship, bookkeeping and finance, information technology, healthcare, and other in-demand fields. Many programs may be free to participants who qualify for workforce funding. Funding is not automatic: the responsible agency must approve the participant, program, and covered costs in writing. If funding is not approved, admissions can explain available self-pay and payment options. Enrollment is open, upcoming cohorts are forming, and PARIS can guide you through program selection, funding steps, the application, required documents, and what to do next."
        data-narration-src="/audio/heroes/home.mp3"
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

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">Regular Courses</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Self-pay and payment-plan programs</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">Use the filters to narrow the catalog instead of scrolling every program. Related names remain consolidated when they represent the same public pathway.</p>
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
