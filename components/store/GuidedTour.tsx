'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { destinationTours, GUIDE_STORAGE_KEYS } from '@/lib/guide/flows';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

type Props = {
  tourId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
};

export default function GuidedTour({ tourId, onComplete, onSkip, autoStart = false }: Props) {
  const naturalVoice = useNaturalVoice();
  const tour = destinationTours[tourId];
  const steps = tour?.steps ?? [];
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback((completed: boolean) => {
    naturalVoice.stop();
    setIsActive(false);
    setCurrentStep(0);
    setTargetRect(null);
    if (completed) {
      localStorage.setItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId), 'true');
      onComplete?.();
    } else {
      onSkip?.();
    }
  }, [naturalVoice, tourId, onComplete, onSkip]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const completed = localStorage.getItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId));
    if (autoStart && !completed) startTour();
  }, [autoStart, startTour, tourId]);

  const current = steps[currentStep];

  useEffect(() => {
    if (!isActive || !current) return;
    void naturalVoice.play(`${current.title}. ${current.content}`, {
      voice: 'coral',
      style: 'commercial',
      rate: 0.96,
    });
    return () => naturalVoice.stop();
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!isActive || !current) return;
    const update = () => {
      const target = document.querySelector(current.target);
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [isActive, current]);

  const next = useCallback(() => {
    if (currentStep >= steps.length - 1) endTour(true);
    else setCurrentStep((value) => value + 1);
  }, [currentStep, steps.length, endTour]);

  const previous = useCallback(() => setCurrentStep((value) => Math.max(0, value - 1)), []);

  useEffect(() => {
    if (!isActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endTour(false);
      if (event.key === 'ArrowRight' || event.key === 'Enter') next();
      if (event.key === 'ArrowLeft') previous();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, endTour, next, previous]);

  if (!isActive || !tour || !current) return null;

  const top = targetRect ? Math.min(window.innerHeight - 220, Math.max(16, targetRect.bottom + 18)) : window.innerHeight / 2 - 100;
  const left = targetRect ? Math.min(window.innerWidth - 336, Math.max(16, targetRect.left + targetRect.width / 2 - 160)) : window.innerWidth / 2 - 160;

  return (
    <>
      {targetRect ? (
        <div
          className="fixed z-[101] rounded-xl ring-4 ring-brand-orange-500 pointer-events-none"
          style={{ top: targetRect.top - 6, left: targetRect.left - 6, width: targetRect.width + 12, height: targetRect.height + 12 }}
        />
      ) : null}
      <div className="fixed z-[102] w-80 rounded-2xl bg-white shadow-2xl" style={{ top, left }} role="dialog" aria-modal="false">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-orange-400 font-black text-white shadow" aria-hidden="true">P<span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-500" /></span>
            <div>
            <p className="text-xs font-semibold text-slate-500">Step {currentStep + 1} of {steps.length}</p>
            <p className="font-bold text-slate-950">PARIS · {tour.name}</p>
            </div>
          </div>
          <button type="button" onClick={() => endTour(false)} aria-label="Close tour"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-950">{current.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{current.content}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex gap-2">
            {currentStep > 0 ? <button type="button" onClick={previous} className="inline-flex items-center gap-1 text-sm font-semibold"><ChevronLeft className="h-4 w-4" />Back</button> : null}
            {currentStep === steps.length - 1 ? <button type="button" onClick={() => setCurrentStep(0)} className="inline-flex items-center gap-1 text-sm font-semibold"><RotateCcw className="h-4 w-4" />Restart</button> : null}
          </div>
          <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-lg bg-brand-orange-600 px-4 py-2 text-sm font-bold text-white">
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}{currentStep < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </>
  );
}

export function useTour() {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  return {
    activeTourId,
    startTour: (tourId: string) => setActiveTourId(tourId),
    endTour: () => setActiveTourId(null),
  };
}
