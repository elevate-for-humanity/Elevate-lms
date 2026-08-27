import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, FileCheck2, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BARBER_SECTIONS } from './barber-rubric-data';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { PROGRAMS } from '@/lib/programs/canonical-data';

export const revalidate = 3600;

const REGISTERED_BARBER = getRegisteredProgramStandard('barber-apprenticeship');
if (!REGISTERED_BARBER) throw new Error('REGISTERED_BARBER_STANDARD_MISSING');
const BARBER = PROGRAMS['barber-apprenticeship'];

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Competency Verification | Elevate for Humanity',
  description:
    'Review the competency-verification framework used with Elevate’s Barber Registered Apprenticeship and the separate Indiana licensing-hour requirements.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber',
  },
};

export default function BarberCompetencyRubricPage() {
  const competencyCount = BARBER_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <Breadcrumbs
            items={[
              { label: 'Compliance', href: '/compliance' },
              { label: 'Competency Verification', href: '/compliance/competency-verification' },
              { label: 'Barber Apprenticeship' },
            ]}
          />
        </div>
      </div>

      <section className="relative isolate h-[clamp(420px,58vh,720px)] overflow-hidden bg-slate-950">
        <Image
          src="/images/barber-hero-new.webp"
          alt="Barber apprentice demonstrating a supervised technical skill"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
        <div className="relative mx-auto flex h-full max-w-6xl items-center px-4 py-12 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 py-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Registered apprenticeship competency verification
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Barber Apprenticeship Competency Framework
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              The registered apprenticeship is competency-based. Competency verification and required Related Technical Instruction are DOL completion controls; Indiana licensing hours are tracked separately for state licensure.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/programs/barber-apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Review Barber Program</Link>
              <Link href="/approvals" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/20">Review Approval Information</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <dl className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <Stat label="Sponsor of record" value={REGISTERED_BARBER.sponsor.sponsor} />
          <Stat label="Occupation" value={REGISTERED_BARBER.standard.occupationTitle} />
          <Stat label="Verified RTI" value={`${REGISTERED_BARBER.completion.requiredRtiHours} hours`} />
          <Stat label="Indiana licensing hours" value={`${BARBER.totalHours.toLocaleString()} hours`} />
        </dl>
      </section>

      <section className="py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red-700">How to read this rubric</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Competency evidence and licensing-hour accounting are separate controls.</h2>
              <div className="mt-6 space-y-4 text-base leading-7 text-slate-700">
                <p>This page contains {competencyCount} practical checkpoints across {BARBER_SECTIONS.length} skill areas. Supervisors and instructors use the checkpoints to document whether the apprentice can perform required work safely and consistently.</p>
                <p>The registered apprenticeship completion basis is competency-based. Work/OJL hours remain auditable evidence but are not a fixed DOL completion denominator. Required RTI and verified competency completion remain controlled by the registered-program contract.</p>
                <p>Indiana licensing-hour and examination requirements are tracked separately so state licensure requirements do not overwrite the registered apprenticeship completion standard.</p>
              </div>
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Do not treat Indiana licensing hours as the DOL registered-apprenticeship completion denominator.</strong> The platform keeps the registered competency/RTI standard and the state licensing-hour requirement as separate controls.</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ControlCard icon={ClipboardCheck} title="Supervisor verification" body="Hands-on competencies should be observed and signed off by the responsible licensed supervisor or evaluator." />
              <ControlCard icon={FileCheck2} title="Documented evidence" body="Work logs, evaluations, course completion, and required records support competency and licensing verification." />
              <ControlCard icon={CheckCircle2} title="Competency standard" body="A learner should demonstrate safe, repeatable performance before a competency is treated as complete." />
              <ControlCard icon={ShieldCheck} title="Canonical controls" body="Registered-program requirements and Indiana licensing requirements resolve from their respective canonical data sources rather than duplicated page text." />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">Competency areas</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Practical evaluation framework</h2>
            <p className="mt-4 leading-7 text-slate-200">Each item below states the competency, assessment method, and minimum evidence expected. Suggested practice hours are intentionally omitted from the public cards so they cannot be mistaken for an official completion denominator.</p>
          </div>

          <div className="mt-10 space-y-6">
            {BARBER_SECTIONS.map((section, sectionIndex) => (
              <article key={section.id} className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Section {sectionIndex + 1}</p><h3 className="mt-1 text-2xl font-extrabold text-white">{section.name}</h3></div>
                  <p className="text-sm font-semibold text-slate-300">{section.items.length} checkpoints</p>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {section.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-slate-950">{item.id}</div>
                        <div><h4 className="font-bold text-white">{item.competency}</h4><dl className="mt-3 space-y-2 text-sm leading-6 text-slate-200"><div><dt className="font-bold text-white">Assessment</dt><dd>{item.assessmentMethod}</dd></div><div><dt className="font-bold text-white">Evidence standard</dt><dd>{item.assessmentCriteria}</dd></div></dl></div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
            <h2 className="text-2xl font-extrabold text-slate-950">Need the official program requirements?</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-700">Use the Barber Apprenticeship page for tuition, admissions, host-shop, funding, and current program requirements. Internal completion decisions must use the apprentice’s actual verified records and the applicable registered/state requirements rather than this public overview alone.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href="/programs/barber-apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Open Barber Apprenticeship</Link><Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-100">Contact Program Staff</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{label}</dt><dd className="mt-2 text-lg font-extrabold text-slate-950">{value}</dd></div>;
}

function ControlCard({ icon: Icon, title, body }: { icon: typeof ClipboardCheck; title: string; body: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="h-6 w-6 text-brand-blue-800" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{body}</p></article>;
}
