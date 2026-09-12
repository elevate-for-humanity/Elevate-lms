import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink, HeartHandshake } from 'lucide-react';
import { ENCHANTED_HEARTS, formatUsd } from '@/lib/partners/enchanted-hearts';

export const metadata: Metadata = {
  title: 'Enchanted Hearts Partnership | Elevate for Humanity',
  description:
    'Explore Elevate for Humanity healthcare training delivered in partnership with Enchanted Hearts Training Institute.',
};

export default function EnchantedHeartsPartnershipPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="overflow-hidden bg-slate-950 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300">
              Elevate healthcare training partner
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
              Train through Elevate. Learn with Enchanted Hearts.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Elevate for Humanity coordinates application, payment, student support, and career
              navigation. Enchanted Hearts Training Institute provides the approved partner-led
              instruction shown below.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#programs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-6 py-3 font-black text-white hover:bg-fuchsia-400"
              >
                Explore programs <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={ENCHANTED_HEARTS.trainingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-black text-white hover:bg-slate-100/10"
              >
                Visit partner website <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-7 shadow-2xl">
            {/* The partner's logo is the only visual asset used from its website. */}
            <img
              src={ENCHANTED_HEARTS.logoUrl}
              alt="Enchanted Hearts Training Institute"
              className="mx-auto h-auto max-h-56 w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-fuchsia-50 px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            [
              'One Elevate application',
              'Apply once and keep enrollment steps in your Elevate dashboard.',
            ],
            [
              'Elevate checkout',
              'Student-facing tuition is invoiced through Elevate’s authorized payment flow.',
            ],
            [
              'Partner-led training',
              'Class scheduling and instructional delivery are coordinated with Enchanted Hearts.',
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-fuchsia-100 bg-white p-5 shadow-sm"
            >
              <CheckCircle2 className="h-6 w-6 text-fuchsia-600" />
              <h2 className="mt-3 font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="programs" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">
              Partner programs
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose your training pathway</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Prices shown are Elevate’s student-facing program prices and include application,
              payment administration, dashboard support, and partner coordination.
            </p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ENCHANTED_HEARTS.programs.map((program) => (
              <article
                key={program.slug}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-wide text-fuchsia-700">
                  {program.duration}
                </p>
                <h3 className="mt-2 text-xl font-black">{program.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{program.summary}</p>
                <p className="mt-5 text-3xl font-black">{formatUsd(program.retailPriceCents)}</p>
                <p className="text-xs font-semibold text-slate-500">
                  Payment options shown during Elevate enrollment
                </p>
                <Link
                  href={`/partnerships/enchanted-hearts/${encodeURIComponent(program.slug)}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-fuchsia-700"
                >
                  View program and pricing <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-7 w-7 text-fuchsia-300" />
              <h2 className="text-2xl font-black">Training connected to career placement</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-300">
              Enchanted Hearts Home Care is connected as the placement and employer pathway. Its
              separate website explains available care services and career opportunities.
            </p>
          </div>
          <a
            href={ENCHANTED_HEARTS.homeCareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-slate-950"
          >
            Visit Enchanted Hearts Home Care <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
