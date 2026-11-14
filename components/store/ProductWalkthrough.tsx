'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Pause, Play, Sparkles } from 'lucide-react';

type Step = { title: string; description: string; label?: string };

export default function ProductWalkthrough({ title, subtitle, steps, tryHref }: { title: string; subtitle: string; steps: Step[]; tryHref: string }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 4200);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  return (
    <section className="px-4 py-16" aria-label={`${title} walkthrough`}>
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 md:p-12">
            <p className="text-sm font-black uppercase tracking-[.2em] text-brand-red-400">Watch it work</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">{title}</h2>
            <p className="mt-4 leading-7 text-slate-300">{subtitle}</p>
            <div className="mt-8 space-y-3">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => { setActive(index); setPlaying(false); }}
                  className={`w-full rounded-xl p-4 text-left transition ${index === active ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{step.label || `Step ${index + 1}`}</span>
                  <span className="mt-1 block font-bold">{step.title}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setPlaying((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-bold">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? 'Pause demo' : 'Play demo'}
              </button>
              <Link href={tryHref} className="rounded-xl bg-brand-red-600 px-5 py-3 font-bold hover:bg-brand-red-700">Try it yourself</Link>
            </div>
          </div>
          <div className="flex min-h-[460px] items-center bg-slate-100 p-6 text-slate-950 md:p-10">
            <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><span className="h-3 w-3 rounded-full bg-slate-300"/><span className="h-3 w-3 rounded-full bg-slate-300"/><span className="h-3 w-3 rounded-full bg-slate-300"/><span className="ml-3 text-xs font-semibold text-slate-400">Elevate AI workspace</span></div>
              <div className="p-7 md:p-10">
                <div className="flex items-center gap-2 text-brand-red-700"><Sparkles className="h-5 w-5"/><span className="text-sm font-black uppercase tracking-wider">{steps[active]?.label || `Step ${active + 1}`}</span></div>
                <h3 className="mt-4 text-2xl font-black">{steps[active]?.title}</h3>
                <p className="mt-3 text-lg leading-8 text-slate-600">{steps[active]?.description}</p>
                <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-900 transition-all duration-700" style={{ width: `${((active + 1) / steps.length) * 100}%` }}/></div>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4"/>No code required to start</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
