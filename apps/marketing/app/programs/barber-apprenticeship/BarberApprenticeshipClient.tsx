'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Scissors,
  ShieldCheck,
  Store,
  WalletCards,
} from 'lucide-react';
import type { HeroBannerConfig } from '@/content/heroBanners';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import HeroVideo from '@/components/marketing/HeroVideo';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

interface Props {
  program: ProgramSchema;
  banner?: HeroBannerConfig | null;
  heroBanner?: HeroBannerConfig | null;
  enrollmentCount?: number;
}

const REGISTERED_BARBER = getRegisteredProgramStandard('barber-apprenticeship');
if (!REGISTERED_BARBER) throw new Error('REGISTERED_BARBER_STANDARD_MISSING');
const RTI_HOURS = REGISTERED_BARBER.completion.requiredRtiHours;
const COMPETENCY_COUNT = REGISTERED_BARBER.completion.competencyCount;

export default function BarberApprenticeshipClient({
  program,
  banner,
  heroBanner,
  enrollmentCount = 0,
}: Props) {
  const b = banner ?? heroBanner ?? null;
  const canonicalHero = getProgramHeroImage(program.slug);
  const canonicalHeroAlt = getProgramImageAlt(program.slug, program.heroImageAlt || program.title);

  const heroCtas = [
    b?.primaryCta ?? {
      label: 'Apply for Enrollment',
      href: '/programs/barber-apprenticeship/apply',
    },
    b?.secondaryCta ?? {
      label: 'Request Information',
      href: '/programs/barber-apprenticeship/request-info',
      variant: 'secondary' as const,
    },
  ];

  const credentials = program.credentials.filter(Boolean);
  const bnplNames = ACTIVE_BNPL_PROVIDERS.map((provider) => provider.name);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {b?.videoSrcDesktop ? (
        <HeroVideo
          videoSrcDesktop={b.videoSrcDesktop}
          videoSrcMobile={b.videoSrcMobile}
          posterImage={canonicalHero}
          voiceoverSrc={b.voiceoverSrc}
          microLabel={b.microLabel ?? 'DOL Registered Apprenticeship'}
          belowHeroHeadline={b.belowHeroHeadline ?? program.title}
          belowHeroSubheadline={b.belowHeroSubheadline ?? program.subtitle}
          ctas={heroCtas}
          trustIndicators={b.trustIndicators}
          transcript={b.transcript}
          analyticsName={b.analyticsName ?? 'barber-apprenticeship'}
        />
      ) : (
        <>
          <section className="relative h-[clamp(260px,42vw,520px)] overflow-hidden bg-slate-100">
            <Image src={canonicalHero} alt={canonicalHeroAlt} fill priority sizes="100vw" className="object-cover" />
          </section>
          <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">DOL Registered Apprenticeship</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{program.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-800">{program.subtitle}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {heroCtas.map((cta) => (
                  <Link key={`${cta.href}-${cta.label}`} href={cta.href} className={cta.variant === 'secondary' ? 'inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-950 hover:bg-slate-50' : 'inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700'}>
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CheckCircle2, label: 'Registered Completion', value: `${COMPETENCY_COUNT} competencies` },
              { icon: GraduationCap, label: 'Related Instruction', value: `${RTI_HOURS} verified RTI hours` },
              { icon: WalletCards, label: 'Self-Pay Tuition', value: `$${BARBER_PRICING.fullPrice.toLocaleString()}` },
              { icon: Store, label: 'Training Site', value: 'Approved host shop' },
            ].map(({ icon: Icon, label, value }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <Icon className="h-6 w-6 text-brand-red-700" aria-hidden="true" />
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-700">{label}</p>
                <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-800">
            RAPIDS {REGISTERED_BARBER.standard.rapidsCode} is competency-based. Supervised work hours, attendance, placement, wage records, and location evidence remain part of the apprenticeship record, but DOL completion is controlled by all {COMPETENCY_COUNT} verified competencies plus {RTI_HOURS} verified RTI hours.{' '}
            {enrollmentCount > 0
              ? `${enrollmentCount} current enrollment records are reflected in the platform.`
              : 'Enrollment is currently available subject to host-shop placement and program review.'}
          </p>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">How the apprenticeship works</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Employment-based training plus structured RTI.</h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-slate-800">
              <p>The apprentice performs supervised work at an approved participating host shop while completing assigned Related Technical Instruction through the Elevate LMS.</p>
              <p>Work records and RTI are tracked separately. Work hours document supervised employment and training; they do not replace registered competency verification or the {RTI_HOURS}-hour RTI requirement.</p>
              <p>Prior training or experience is not automatically credited. Transfer decisions require supporting documentation and sponsor review before they change the official registered record.</p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/programs/barber-apprenticeship/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">
                Start Apprentice Application <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/host-shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-950 hover:bg-slate-50">
                Host Shop Information
              </Link>
            </div>
          </div>
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <Image src="/images/pages/barber-apprentice-learning.webp" alt="Barber apprentice receiving supervised hands-on training" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Program requirements</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">What must be completed.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              `All ${COMPETENCY_COUNT} registered competencies verified by authorized supervision`,
              `${RTI_HOURS} verified Related Technical Instruction hours mapped to the approved standard`,
              'Required supervised-work, placement, wage, attendance, and apprenticeship evidence',
              'Current Indiana licensing application and examination requirements after registered-program completion',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                <p className="font-semibold leading-6">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <strong>Licensing distinction:</strong> registered-program completion and Indiana barber licensure are separate controls. State licensing remains subject to current application, examination, and documentation requirements.
          </div>
        </div>
      </section>

      {credentials.length > 0 && (
        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Credential pathway</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Completion and licensing outcomes.</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {credentials.map((credential) => (
                <article key={credential.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-brand-blue-700" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-black text-slate-950">{credential.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-brand-blue-800">{credential.issuer}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-800">{credential.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="funding" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Funding & payment</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">One price source. Multiple payment paths.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-800">
            Current self-pay tuition is <strong>${BARBER_PRICING.fullPrice.toLocaleString()}</strong>. Prior-training or experience credit does not automatically reduce tuition. Public or employer funding must be separately authorized before it is treated as payment.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black text-slate-950">Pay in Full</h3>
              <p className="mt-3 text-sm leading-6 text-slate-800">Complete one secure checkout for the current self-pay tuition amount.</p>
              <Link href="/programs/barber-apprenticeship/apply?payment=pay_in_full" className="mt-5 inline-flex font-bold text-brand-red-700 hover:underline">Apply & choose pay in full →</Link>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black text-slate-950">Payment Plan</h3>
              <p className="mt-3 text-sm leading-6 text-slate-800">Minimum down payment is ${BARBER_PRICING.minDownPayment.toLocaleString()}; the remaining balance is scheduled over {BARBER_PRICING.paymentTermWeeks} weekly payments under the current plan configuration.</p>
              <Link href="/programs/barber-apprenticeship/apply?payment=payment_plan" className="mt-5 inline-flex font-bold text-brand-red-700 hover:underline">Open payment calculator →</Link>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black text-slate-950">BNPL / Funding Review</h3>
              <p className="mt-3 text-sm leading-6 text-slate-800">Eligible checkout options currently configured include {bnplNames.length ? bnplNames.join(', ') : 'available providers shown at checkout'}. Provider approval and terms vary. Workforce funding requires separate eligibility and authorization.</p>
              <Link href="/programs/barber-apprenticeship/apply" className="mt-5 inline-flex font-bold text-brand-red-700 hover:underline">Review all options →</Link>
            </article>
          </div>
        </div>
      </section>

      <FeaturedHostPartners programSlug="barber-apprenticeship" />
      <BarberWorkforceNetworkMap />

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <Scissors className="h-7 w-7 text-brand-red-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">I want to become an apprentice</h2>
            <p className="mt-3 leading-7 text-slate-800">Use the apprentice application for enrollment, prior-training evidence, funding, payment options, and host-shop placement information.</p>
            <Link href="/programs/barber-apprenticeship/apply" className="mt-5 inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">Apprentice application <ArrowRight className="h-4 w-4" /></Link>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <Store className="h-7 w-7 text-brand-blue-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">I own or manage a shop</h2>
            <p className="mt-3 leading-7 text-slate-800">Host-shop applications are employer applications. They are separate from student enrollment and use their own onboarding, MOU, document, and portal workflow.</p>
            <Link href="/host-shop" className="mt-5 inline-flex items-center gap-2 font-bold text-brand-blue-800 hover:underline">Host Shop program <ArrowRight className="h-4 w-4" /></Link>
          </article>
        </div>
      </section>
    </main>
  );
}
