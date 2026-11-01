'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PlatformCapability } from '@/lib/platform/capability-catalog';
import { capabilityWalkthrough } from '@/lib/store/capability-walkthroughs';
import { ProgramNarration } from '@/components/programs/NarratedProgramIntro';

export default function PlanDemoWorkspace({
  name,
  description,
  capabilities,
}: {
  name: string;
  description: string;
  capabilities: PlatformCapability[];
}) {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const capability = capabilities[selected];
  const slides = capabilityWalkthrough(capability?.key || '', capability?.name || name);
  const current = slides[step];
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
        Guided demo • illustrative sample records
      </p>
      <h1 className="mt-2 text-2xl font-black">{name}</h1>
      <p className="mt-2 text-sm leading-6">{description}</p>
      <p className="mt-2 text-xs text-slate-600">
        Explore the included workflows. No live record, payment, message or publication is created.
      </p>
      {capabilities.length > 0 && (
        <div className="my-4 flex flex-wrap gap-2" aria-label="Included tools">
          {capabilities.map((item, index) => (
            <button
              type="button"
              key={item.key}
              aria-pressed={selected === index}
              onClick={() => {
                setSelected(index);
                setStep(0);
              }}
              className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold ${selected === index ? 'bg-slate-950 text-white' : 'bg-white'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      <section
        className="mt-4 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg"
        aria-label="Demonstration screen"
      >
        <div className="bg-slate-950 px-4 py-3 text-sm font-bold text-white">
          {capability?.name || name} · Sample workspace
        </div>
        <div className="p-5">
          <p className="text-xs font-bold text-orange-800">
            Step {step + 1} of {slides.length}
          </p>
          <h2 className="mt-2 text-xl font-bold">{current.title}</h2>
          <p className="mt-3 text-sm leading-6">{current.action}</p>
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-600">Example record</p>
            <p className="mt-2 font-bold">{current.record}</p>
            <p className="mt-2 text-sm">{current.result}</p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((value) => value - 1)}
              className="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setStep((value) => (value + 1) % slides.length)}
              className="min-h-11 rounded-lg bg-slate-950 px-4 font-bold text-white"
            >
              {step === slides.length - 1 ? 'Replay demo' : 'Next step'}
            </button>
          </div>
          <ProgramNarration
            key={`${capability?.key}-${step}`}
            text={`${name}. ${capability?.name || ''}. ${current.title}. ${current.action}. ${current.result}`}
          />
          {capability && (
            <Link
              className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline"
              href={capability.demoHref || `/store/demo/capability/${capability.key}`}
            >
              Open the full {capability.name} demo
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
