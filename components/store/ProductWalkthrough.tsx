'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Globe2,
  Mic,
  Monitor,
  Pause,
  Play,
  Smartphone,
  Sparkles,
} from 'lucide-react';

type Step = { title: string; description: string; label?: string };

const QUICK_EDITS = ['Change colors', 'Rewrite services', 'Add booking', 'Mobile preview'];

export default function ProductWalkthrough({
  title,
  subtitle,
  steps,
  tryHref,
}: {
  title: string;
  subtitle: string;
  steps: Step[];
  tryHref: string;
}) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 4200);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  if (steps.length === 0) return null;

  const step = steps[active];
  const progress = ((active + 1) / steps.length) * 100;

  return (
    <section className="border-y border-cyan-100 bg-gradient-to-b from-cyan-50 via-white to-rose-50 px-4 py-16" aria-label={`${title} walkthrough`}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Click through the builder</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">{title}</h2>
          <p className="mt-4 font-medium leading-7 text-slate-700">{subtitle}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-cyan-950/10 ring-1 ring-slate-200">
          <div className="grid xl:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-white p-5 xl:border-b-0 xl:border-r">
              <div className="space-y-2">
                {steps.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setActive(index);
                      setPlaying(false);
                    }}
                    className={`w-full rounded-xl p-4 text-left transition ${index === active ? 'bg-cyan-50 text-cyan-950 ring-1 ring-cyan-200' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider text-brand-red-700">{item.label || `Step ${index + 1}`}</span>
                    <span className="mt-1 block text-sm font-black">{item.title}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setPlaying((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-black text-slate-800 hover:bg-slate-50">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause' : 'Auto play'}
                </button>
                <Link href={tryHref} className="inline-flex min-h-11 items-center rounded-xl bg-brand-red-700 px-4 text-sm font-black text-white hover:bg-brand-red-800">Try it</Link>
              </div>
            </aside>

            <div className="bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4 sm:p-7">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-300" /><span className="h-3 w-3 rounded-full bg-amber-300" /><span className="h-3 w-3 rounded-full bg-emerald-300" /><span className="ml-2 text-xs font-black text-slate-500">Elevate Website Builder</span></div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMobile(false)} className={`rounded-lg p-2 ${!mobile ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`} aria-label="Desktop preview"><Monitor className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setMobile(true)} className={`rounded-lg p-2 ${mobile ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`} aria-label="Mobile preview"><Smartphone className="h-4 w-4" /></button>
                    <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800">Saved</span>
                  </div>
                </div>

                <div className="grid min-h-[500px] lg:grid-cols-[250px_minmax(0,1fr)]">
                  <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                      <div className="flex items-center gap-2 text-cyan-900"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-wider">PARIS</span></div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{step.description}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {QUICK_EDITS.map((edit, index) => (
                        <button
                          key={edit}
                          type="button"
                          onClick={() => {
                            setPlaying(false);
                            if (edit === 'Mobile preview') setMobile(true);
                            setActive(Math.min(steps.length - 1, Math.max(active, index + 1)));
                          }}
                          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                        >
                          <Mic className="h-3.5 w-3.5 text-brand-red-700" /> {edit}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current step</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{step.title}</p>
                    </div>
                  </div>

                  <div className="grid place-items-center p-4 sm:p-7">
                    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all ${mobile ? 'w-[260px] max-w-full' : 'w-full max-w-3xl'}`}>
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-2 font-black text-slate-900"><Globe2 className="h-4 w-4 text-brand-red-700" /> BrightCare Services</div>
                        <div className="hidden gap-3 text-[10px] font-bold text-slate-500 sm:flex"><span>Services</span><span>About</span><span>Contact</span></div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-100 via-white to-rose-100 p-5 sm:p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-red-700">Professional care. Clear next steps.</p>
                        <h3 className={`${mobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} mt-2 font-black leading-tight text-slate-950`}>{active < 2 ? 'A professional website starts with a conversation.' : 'Care that feels personal. A website that makes the next step simple.'}</h3>
                        <p className="mt-3 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">{active < 3 ? 'PARIS builds the first draft, then keeps changing the saved site as the owner talks or types.' : 'Services, booking, mobile layout and calls to action update without starting the website over.'}</p>
                        <div className="mt-5 inline-flex rounded-lg bg-brand-red-700 px-4 py-2 text-xs font-black text-white">Book a consultation</div>
                      </div>
                      <div className={`grid gap-3 p-4 ${mobile ? 'grid-cols-1' : 'sm:grid-cols-3'}`}>
                        {['Home Care', 'Care Planning', 'Family Support'].map((service) => <div key={service} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="h-16 rounded-lg bg-gradient-to-br from-cyan-100 to-rose-100" /><p className="mt-2 text-xs font-black">{service}</p></div>)}
                      </div>
                      {active >= steps.length - 1 ? <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-800">Preview approved · Ready to publish</div> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"><div className="h-full bg-cyan-700 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Click the steps, PARIS commands, or desktop/mobile preview to explore the workflow.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
