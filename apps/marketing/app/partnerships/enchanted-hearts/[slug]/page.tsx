import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  ENCHANTED_HEARTS,
  formatUsd,
  getEnchantedHeartsProgram,
} from '@/lib/partners/enchanted-hearts';

export function generateStaticParams() {
  return ENCHANTED_HEARTS.programs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const program = getEnchantedHeartsProgram((await params).slug);
  if (!program) return { robots: { index: false, follow: false } };
  return {
    title: `${program.title} | Elevate for Humanity`,
    description: `${program.summary} ${program.duration}. Apply and pay securely through Elevate for Humanity.`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const program = getEnchantedHeartsProgram((await params).slug);
  if (!program) notFound();
  const margin = program.retailPriceCents - program.providerShareCents;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/partnerships/enchanted-hearts"
            className="inline-flex items-center gap-2 text-sm font-bold text-fuchsia-200"
          >
            <ArrowLeft className="h-4 w-4" /> All Enchanted Hearts programs
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">
                Elevate partner-led healthcare training
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                {program.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{program.summary}</p>
              <p className="mt-5 text-sm font-black uppercase tracking-wide text-fuchsia-200">
                {program.duration}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
              <p className="text-sm font-bold text-slate-500">Elevate student price</p>
              <p className="mt-1 text-4xl font-black">{formatUsd(program.retailPriceCents)}</p>
              <Link
                href={`/enroll/${program.slug}?partner=enchanted-hearts`}
                className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-fuchsia-600 px-5 py-3 font-black text-white"
              >
                Apply and pay through Elevate
              </Link>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                A secure QuickBooks payment link is created after sign-in. Coupon codes can be
                entered before checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black">What the price includes</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {[
                'Elevate application and enrollment support',
                'Partner-led instruction through Enchanted Hearts',
                'Student dashboard and progress coordination',
                'Payment administration and eligible payment options',
                'Career-navigation and placement coordination',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-7">
            <h2 className="text-2xl font-black">How payment is divided</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-fuchsia-200 pb-3">
                <dt>Enchanted Hearts provider share</dt>
                <dd className="font-black">{formatUsd(program.providerShareCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-fuchsia-200 pb-3">
                <dt>Elevate administration and coordination</dt>
                <dd className="font-black">{formatUsd(margin)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base">
                <dt className="font-black">Student price</dt>
                <dd className="font-black">{formatUsd(program.retailPriceCents)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex gap-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">
              <ShieldCheck className="h-6 w-6 shrink-0 text-fuchsia-700" />
              <p>
                Provider payout is released only after payment clears and the required agreement,
                tax documents, delivery milestones, and payout account are approved.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">About the training partner</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review Enchanted Hearts’ original program information, then return to Elevate to
              apply, use a coupon, and complete payment.
            </p>
          </div>
          <a
            href={ENCHANTED_HEARTS.trainingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-black"
          >
            Visit Enchanted Hearts <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
