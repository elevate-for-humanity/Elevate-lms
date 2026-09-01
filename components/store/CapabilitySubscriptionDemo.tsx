'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, PlayCircle, Sparkles, TrendingUp, ShieldCheck, Layers3 } from 'lucide-react';

type DemoStep = {
  eyebrow: string;
  title: string;
  body: string;
};

interface Props {
  name: string;
  description: string;
  categoryLabel: string;
  priceLabel: string;
  subscriptionDetails: string[];
  actionHref: string;
  trialText: string;
}

export default function CapabilitySubscriptionDemo({
  name,
  description,
  categoryLabel,
  priceLabel,
  subscriptionDetails,
  actionHref,
  trialText,
}: Props) {
  const steps: DemoStep[] = [
    {
      eyebrow: '1 · See what it does',
      title: name,
      body: description,
    },
    {
      eyebrow: '2 · Try it first',
      title: 'Use the capability during the 14-day trial',
      body: trialText,
    },
    {
      eyebrow: '3 · Understand the subscription',
      title: priceLabel,
      body: 'The demo shows the commercial model before checkout so customers know what continues after the trial and what becomes an upgrade.',
    },
    {
      eyebrow: '4 · Activate when ready',
      title: 'Keep the tools you actually use',
      body: 'Start small, then activate the subscription, add-on, credits, or higher-capacity plan only when the business needs it.',
    },
  ];

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const recommendedAddOns =
    /workforce|compliance|government/i.test(categoryLabel)
      ? ['ZORA compliance assistant', 'Reporting and audit workflows', 'Role-based access']
      : /education|learning|course/i.test(categoryLabel)
        ? ['ELLIE learner support', 'Credential management', 'Student progress reporting']
        : /ai/i.test(categoryLabel)
          ? ['Natural voice', 'CRM and workflow automation', 'AI Team Orchestrator']
          : ['PARIS sales and intake', 'CRM and follow-up automation', 'Reporting dashboard'];

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  return (
    <section className="bg-slate-950 px-4 py-12 text-white sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{categoryLabel} subscription demo</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">See {name} before you activate it.</h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-100">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 font-black text-white hover:bg-white/15"
          >
            <PlayCircle className="h-5 w-5" /> {playing ? 'Pause demo' : 'Play demo'}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900 shadow-2xl">
          <div className="grid min-h-[430px] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex items-center p-6 sm:p-10">
              <div key={step} className="w-full animate-[capabilityDemoIn_.35s_ease-out]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{steps[step].eyebrow}</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-black text-white sm:text-5xl">{steps[step].title}</h2>
                <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-100 sm:text-lg">{steps[step].body}</p>

                <div className="mt-7 flex gap-2">
                  {steps.map((item, index) => (
                    <button
                      key={item.eyebrow}
                      type="button"
                      onClick={() => setStep(index)}
                      aria-label={`Show demo step ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${index === step ? 'w-12 bg-cyan-300' : 'w-5 bg-white/25 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-white p-6 text-slate-950 lg:border-l lg:border-t-0 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-brand-red-700">
                <CreditCard className="h-5 w-5" /> Subscription snapshot
              </div>
              <p className="mt-4 text-3xl font-black text-slate-950">{priceLabel}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{trialText}</p>

              <div className="mt-6 space-y-3">
                {subscriptionDetails.map((detail) => (
                  <div key={detail} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <span className="text-sm font-bold leading-6 text-slate-900">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="flex items-center gap-2 font-black text-slate-950"><Sparkles className="h-5 w-5 text-cyan-700" /> Trial first</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">Customers can see the workflow before they commit, then upgrade only for the capacity and automation they want to keep.</p>
              </div>

              <Link
                href={actionHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white hover:bg-brand-red-800"
              >
                View / start {name} <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-6">
            <TrendingUp className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Operational upside</p>
            <h2 className="mt-2 text-xl font-black">Turn a disconnected task into a tracked workflow</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">Reduce manual handoffs, preserve one accountable record, and give staff a repeatable process they can measure instead of rebuilding work in email and spreadsheets.</p>
          </article>
          <article className="rounded-2xl border border-cyan-400/30 bg-cyan-950/40 p-6">
            <ShieldCheck className="h-6 w-6 text-cyan-300" aria-hidden="true" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Why it is a must-have</p>
            <h2 className="mt-2 text-xl font-black">The proof stays connected to the action</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">A serious buyer should be able to verify ownership, status, history, outcomes, and exceptions. Elevate keeps those controls in the operating workflow instead of treating compliance as an after-the-fact report.</p>
          </article>
          <article className="rounded-2xl border border-orange-400/30 bg-orange-950/40 p-6">
            <Layers3 className="h-6 w-6 text-orange-300" aria-hidden="true" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-orange-300">Recommended with this</p>
            <ul className="mt-3 space-y-2">
              {recommendedAddOns.map((item) => <li key={item} className="flex gap-2 text-sm font-bold text-slate-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />{item}</li>)}
            </ul>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Purchase path</p>
            <h2 className="mt-2 text-2xl font-black">Test it, select the right capacity, then pay securely.</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-200">Start a no-card trial or choose a base plan and add-ons. Workspace setup happens before payment so the subscription and entitlements attach to the correct organization.</p>
          </div>
          <div className="mt-5 grid shrink-0 gap-2 sm:mt-0">
            <Link href="/store/plans" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 font-black text-white hover:bg-brand-red-700">Choose plan & payment <CreditCard className="h-4 w-4" /></Link>
            <Link href="/store/trial" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-6 font-bold text-white hover:bg-white/10">Start 14-day trial</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes capabilityDemoIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
