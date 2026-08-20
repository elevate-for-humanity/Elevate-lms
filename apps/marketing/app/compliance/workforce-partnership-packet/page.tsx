export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, FileCheck, ShieldCheck, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
  getPublicFundingLabels,
} from '@/lib/programs/funding-registry';
import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';

export const metadata: Metadata = {
  title: 'Workforce Partnership Packet | Elevate for Humanity',
  description:
    'Workforce partnership information based on current documented program, apprenticeship, funding, and enrollment records. Funding is never inferred from provider status alone.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/workforce-partnership-packet',
  },
};

const controls = [
  {
    icon: FileCheck,
    title: 'Program-level evidence controls public claims',
    text: 'Provider approval, a funding relationship, or a listing does not make every Elevate program eligible for the same funding source. Public funding labels come from the canonical program funding registry.',
  },
  {
    icon: ShieldCheck,
    title: 'Participant authorization is separate',
    text: 'Even when a program has a documented funding approval, the responsible agency determines participant eligibility, covered costs, available funds, and written authorization.',
  },
  {
    icon: Building2,
    title: 'Registered Apprenticeship is occupation-specific',
    text: 'Registered Apprenticeship claims are limited to occupations covered by the sponsor standards and current sponsor records. Host employers participate within that sponsor structure.',
  },
];

export default function WorkforcePartnershipPacketPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Compliance', href: '/compliance' },
              { label: 'Workforce Partnership Packet' },
            ]}
          />
        </div>
      </div>

      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-red-400">
            Government & Workforce Partner Information
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">Workforce Partnership Packet</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
            This page is intentionally limited to claims supported by current institutional,
            program-level, apprenticeship, and funding records. It is not a blanket funding or
            outcome statement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/workone-partner-packet"
              className="rounded-lg bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700"
            >
              Program Funding Records
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10"
            >
              Request Documentation
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold">Institutional identity</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization</p>
              <p className="mt-2 font-bold">{PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                2Exclusive LLC-S d/b/a {PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute,
                Indianapolis, Indiana.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Apprenticeship</p>
              <p className="mt-2 font-bold">DOL Registered Apprenticeship Sponsor</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{RAPIDS_SPONSOR_LABEL}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold">Public claim controls</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {controls.map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <item.icon className="h-6 w-6 text-brand-red-600" />
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-brand-red-600" />
            <h2 className="text-2xl font-extrabold">Currently evidenced public funding records</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Only programs with exact program-level evidence appear below. Programs not shown here
            should not be described publicly as WIOA-, ETPL-, or Workforce Ready Grant-funded unless
            the canonical registry is updated with current evidence.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <article key={program.slug} className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {getPublicFundingLabels(program.slug).map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">{program.sourceNote}</p>
                <Link
                  href={`/programs/${program.slug}`}
                  className="mt-5 inline-flex font-bold text-brand-red-700 hover:underline"
                >
                  Review program record
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-amber-200 bg-amber-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bold text-amber-950">Partner use notice</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">
            Use the exact program page, current funding record, enrollment documentation, and agency
            authorization when making a referral or funding decision. Do not rely on archived packets,
            screenshots, marketing copy, or provider-level status as proof that a specific participant
            or program is funded.
          </p>
        </div>
      </section>
    </main>
  );
}
