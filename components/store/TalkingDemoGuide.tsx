'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

export type DemoStep = {
  title: string;
  narration: string;
  actionLabel?: string;
};

export function TalkingDemoGuide({
  productName,
  steps,
  onStepChange,
}: {
  productName: string;
  steps: DemoStep[];
  onStepChange?: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const naturalVoice = useNaturalVoice();
  const step = steps[index];
  const speaking = naturalVoice.isPlaying || naturalVoice.isPaused || naturalVoice.isLoading;

  const stop = () => naturalVoice.stop();

  const speak = () => {
    if (muted || !step) return;
    void naturalVoice.play(`${productName}. ${step.title}. ${step.narration}`, {
      voice: 'coral',
      style: 'commercial',
      rate: 1,
    });
  };

  const selectStep = (next: number) => {
    stop();
    const safe = Math.max(0, Math.min(steps.length - 1, next));
    setIndex(safe);
    onStepChange?.(safe);
  };

  if (!step) return null;

  return (
    <aside className="rounded-2xl border border-brand-red-300 bg-white p-5 shadow-sm" aria-label={`${productName} narrated demo guide`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">Interactive guided demo</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">{productName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setMuted((value) => !value); stop(); }}
            className="rounded-lg border border-slate-400 p-2 text-slate-800 hover:bg-slate-50"
            aria-label={muted ? 'Unmute natural demo narration' : 'Mute natural demo narration'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={speaking ? stop : speak}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white hover:bg-slate-800"
          >
            {speaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {naturalVoice.isLoading ? 'Preparing…' : speaking ? 'Stop' : 'Hear Demo'}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <span>Step {index + 1} of {steps.length}</span>
          <span>{step.actionLabel || 'Explore the screen'}</span>
        </div>
        <h3 className="mt-2 text-base font-black text-slate-950">{step.title}</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{step.narration}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => selectStep(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-400 px-3 py-2 text-sm font-bold text-slate-800 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-1.5" aria-label="Demo progress">
          {steps.map((_, dot) => (
            <button
              key={dot}
              type="button"
              aria-label={`Go to demo step ${dot + 1}`}
              onClick={() => selectStep(dot)}
              className={`h-2.5 w-2.5 rounded-full ${dot === index ? 'bg-brand-red-600' : 'bg-slate-400'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => selectStep(index + 1)}
          disabled={index === steps.length - 1}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-red-600 px-3 py-2 text-sm font-black text-white disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {naturalVoice.error ? <p className="mt-3 text-sm font-semibold text-red-800">Natural narration is temporarily unavailable; the written demo remains available.</p> : null}
    </aside>
  );
}
