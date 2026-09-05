import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { isRAPIDSProgram } from '@/lib/compliance/rapids-config';

function totalHours(program: ProgramSchema): number {
  return Object.values(program.hoursBreakdown).reduce((sum, value) => sum + value, 0);
}

function fundingAnswer(program: ProgramSchema): string {
  if (program.funding?.wioa_eligible && program.funding?.etpl_approved) {
    return 'This track is marked WIOA-eligible and ETPL-approved in Elevate’s canonical program record. Participant eligibility, local authorization, and available funds still determine whether WorkOne can issue funding.';
  }
  if (program.funding?.fundingNotes) return program.funding.fundingNotes;
  return 'Funding varies by program, participant, region, and current authorization. This track is not marked as WIOA-funded in Elevate’s canonical program record, so staff should not promise tuition coverage.';
}

function registrationAnswer(program: ProgramSchema): string {
  if (isRAPIDSProgram(program.slug)) {
    return 'Yes. This track is listed in Elevate’s canonical RAPIDS program registry under the registered Sponsor of Record. Completion and licensing still require satisfying the applicable program and Indiana licensing requirements.';
  }
  return 'Elevate operates Registered Apprenticeship infrastructure, but this specific track is not currently listed in the canonical RAPIDS program registry used by the platform. Admissions should confirm the current sponsor/registration status before making a DOL-registration claim for this track.';
}

function trackNoun(program: ProgramSchema): string {
  if (/barber/i.test(program.slug)) return 'barbershop';
  if (/nail|manicur/i.test(program.slug)) return 'nail salon or spa';
  return 'salon';
}

export function buildBeautyProgramStructuredData(program: ProgramSchema) {
  const registered = isRAPIDSProgram(program.slug);
  const hours = totalHours(program);
  const credentialNames = program.credentials.map((credential) => credential.name).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: program.title,
    description: program.metaDescription || program.subtitle,
    url: `https://www.elevateforhumanity.org/programs/${program.slug}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Elevate for Humanity Career & Technical Institute',
      url: 'https://www.elevateforhumanity.org',
    },
    programType: registered ? 'Registered Apprenticeship' : 'Apprenticeship pathway',
    timeToComplete: program.durationWeeks > 0 ? `P${program.durationWeeks}W` : undefined,
    educationalCredentialAwarded: credentialNames.length ? credentialNames.join('; ') : undefined,
    occupationalCredentialAwarded: credentialNames[0] || undefined,
    programPrerequisites: program.admissionRequirements || undefined,
    offers: {
      '@type': 'Offer',
      category: 'Apprenticeship Program',
      description: fundingAnswer(program),
      priceSpecification: program.selfPayCost
        ? {
            '@type': 'PriceSpecification',
            priceCurrency: 'USD',
            description: `Published self-pay information: ${program.selfPayCost}`,
          }
        : undefined,
    },
    numberOfCredits: undefined,
    occupationalCategory: program.category,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Total structured training hours displayed by Elevate',
        value: String(hours),
      },
      {
        '@type': 'PropertyValue',
        name: 'Funding status',
        value:
          program.funding?.wioa_eligible && program.funding?.etpl_approved
            ? 'Program record indicates WIOA/ETPL eligibility; participant authorization still required.'
            : 'Funding varies; WIOA tuition coverage is not represented as guaranteed.',
      },
    ],
  };
}

export default function BeautyApprenticeshipAuthority({ program }: { program: ProgramSchema }) {
  const registered = isRAPIDSProgram(program.slug);
  const hours = totalHours(program);
  const wioaEtpl = Boolean(program.funding?.wioa_eligible && program.funding?.etpl_approved);
  const locations = program.locations?.filter((location) => location.status === 'active') ?? [];
  const shopNoun = trackNoun(program);
  const pathwaySteps = [
    [
      'Apply and complete intake',
      'Choose the track, submit the application, and provide the identity, eligibility, and enrollment information requested in your portal.',
    ],
    [
      'Confirm tuition or funding',
      'Staff verifies self-pay, an approved payment option, or current workforce funding authorization before enrollment is finalized.',
    ],
    [
      'Secure an approved Host Site',
      `Select an available approved ${shopNoun}, request placement help, or invite a preferred licensed business to apply. Capacity is confirmed individually.`,
    ],
    [
      'Complete orientation and agreements',
      'Review the handbook, sign the required apprenticeship and host-site documents, and complete safety and program orientation before training begins.',
    ],
    [
      'Train and complete related instruction',
      `Learn in the ${shopNoun} under qualified supervision while completing the required technical instruction for this pathway.`,
    ],
    [
      'Log hours and competencies',
      'Use the portal to enter attendance, hours, skills, milestones, and supporting documents. The assigned supervisor reviews and verifies progress.',
    ],
    [
      'Finish closeout and licensing steps',
      'Complete the required hours and competencies, resolve missing records, complete final documentation, and follow the applicable state testing or licensing process.',
    ],
  ] as const;

  const faqs = [
    {
      question: `How many hours is the ${program.title}?`,
      answer: `Elevate’s canonical program record currently displays ${hours.toLocaleString()} structured hours across on-the-job/practical training and related instruction components. The program page above shows the detailed breakdown used by the platform.`,
    },
    {
      question: 'Can I use WorkOne / WIOA funding for this apprenticeship?',
      answer: fundingAnswer(program),
    },
    {
      question: 'Is this track DOL registered?',
      answer: registrationAnswer(program),
    },
    {
      question: `How does the ${program.title} differ from a traditional school-only pathway?`,
      answer: `This pathway is structured around supervised training in a real ${shopNoun} plus related technical instruction and digital progress tracking. Employment, wages, placement, funding, and licensing outcomes depend on the applicable host-site arrangement and program requirements and are not guaranteed by the website.`,
    },
  ];

  return (
    <>
      <section
        className="bg-white px-4 py-14 sm:py-16"
        aria-labelledby={`${program.slug}-authority-heading`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-rose-700">
                Program Authority & Host-Site Pathway
              </p>
              <h2
                id={`${program.slug}-authority-heading`}
                className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
              >
                Train in a real Indiana {shopNoun} with a clearly documented pathway.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700">
                Elevate separates the training model, funding status, host-site relationship, and
                licensing requirements so applicants and workforce partners can see exactly what
                applies to this track.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="h-6 w-6 text-rose-700" />
                  <div className="mt-3 text-sm font-black text-slate-950">
                    {registered ? 'Registered Apprenticeship' : 'Apprenticeship Pathway'}
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                    {registered
                      ? 'Listed in Elevate’s canonical RAPIDS program registry.'
                      : 'Registration status must be confirmed before a DOL-specific claim is used.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CircleDollarSign className="h-6 w-6 text-emerald-700" />
                  <div className="mt-3 text-sm font-black text-slate-950">
                    {wioaEtpl ? 'WIOA / ETPL Eligible' : 'Funding Review Required'}
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                    Funding is never represented as guaranteed without current program and
                    participant authorization.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <GraduationCap className="h-6 w-6 text-violet-700" />
                  <div className="mt-3 text-sm font-black text-slate-950">
                    {hours.toLocaleString()} Structured Hours
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                    Pulled from the canonical program hours breakdown shown on this page.
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
              <div className="flex items-start gap-3">
                <Building2 className="mt-1 h-6 w-6 shrink-0 text-rose-700" />
                <div>
                  <h3 className="text-xl font-black text-slate-950">Find or bring a Host Site</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    Host-site availability changes by region. Applicants can select an active
                    approved location when available or ask a preferred licensed business to apply
                    to the Elevate Host Site network.
                  </p>
                </div>
              </div>
              {locations.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {locations.slice(0, 8).map((location) => (
                    <div
                      key={`${location.city}-${location.state}`}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-800"
                    >
                      <MapPin className="h-4 w-4 text-rose-700" /> {location.city}, {location.state}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">
                  Current openings are confirmed during placement review rather than advertised for
                  cities where no active host record is on file.
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={program.cta.applyHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-800"
                >
                  Apply to this track <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/partners/host-shops"
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-black text-rose-900 hover:bg-rose-100"
                >
                  Become a Host Site
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-12" aria-labelledby={`${program.slug}-process-heading`}>
            <p className="text-sm font-black uppercase tracking-[0.15em] text-rose-700">
              Start-to-finish process
            </p>
            <h3
              id={`${program.slug}-process-heading`}
              className="mt-2 text-3xl font-black tracking-tight text-slate-950"
            >
              How the apprenticeship works
            </h3>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700">
              Follow these steps in order. Your portal shows the records, signatures, hours, and
              approvals still required at each stage.
            </p>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {pathwaySteps.map(([title, body], index) => (
                <li key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-700 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-black text-slate-950">{title}</h4>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Responsibility
                title="What the apprentice does"
                body="Completes instruction, attends scheduled training, logs work and hours, uploads requested records, and responds to corrections or missing-item notices."
              />
              <Responsibility
                title="What the Host Site does"
                body="Provides qualified supervision, a safe workplace, scheduled learning opportunities, and verification of hours, competencies, and progress."
              />
              <Responsibility
                title="What Elevate does"
                body="Provides related instruction and portal tools, reviews required documentation, monitors progress, supports compliance, and coordinates program closeout."
              />
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              <BadgeCheck className="h-5 w-5 text-rose-700" /> Frequently asked questions
            </div>
            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5 open:bg-slate-50">
                  <summary className="cursor-pointer list-none pr-6 text-base font-black text-slate-950">
                    {faq.question}
                  </summary>
                  <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-700">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Responsibility({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
      <h4 className="text-base font-black text-slate-950">{title}</h4>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
    </article>
  );
}
