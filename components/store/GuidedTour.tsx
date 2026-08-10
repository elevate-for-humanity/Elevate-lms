'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { destinationTours, GUIDE_STORAGE_KEYS } from '@/lib/guide/flows';

interface GuidedTourProps {
  tourId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export default function GuidedTour({ tourId, onComplete, onSkip, autoStart = false }: GuidedTourProps) {
  const tour = destinationTours[tourId];
  const steps = useMemo(() => tour?.steps ?? [], [tour]);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const startTour = useCallback(() => {
    if (!tour || steps.length === 0) return;
    setCurrentStep(0);
    setIsActive(true);
  }, [steps.length, tour]);

  const endTour = useCallback((completed: boolean) => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetRect(null);
    if (completed) {
      localStorage.setItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId), 'true');
      onComplete?.();
    } else {
      onSkip?.();
    }
  }, [onComplete, onSkip, tourId]);

  useEffect(() => {
    if (!autoStart || !tour || steps.length === 0) return;
    const completed = localStorage.getItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId));
    if (!completed) startTour();
  }, [autoStart, startTour, steps.length, tour, tourId]);

  useEffect(() => {
    if (!isActive) return undefined;
    const step = steps[currentStep];
    if (!step) return undefined;

    const update = () => {
      const element = document.querySelector(step.target);
      if (!element) {
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    };

    update();
    const element = document.querySelector(step.target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [currentStep, isActive, steps]);

  useEffect(() => {
    if (!isActive) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endTour(false);
      if (event.key === 'ArrowLeft') setCurrentStep((value) => Math.max(0, value - 1));
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        setCurrentStep((value) => {
          if (value >= steps.length - 1) {
            queueMicrotask(() => endTour(true));
            return value;
          }
          return value + 1;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [endTour, isActive, steps.length]);

  if (!isActive || !tour || steps.length === 0) return null;

  const step = steps[currentStep];
  const tooltipWidth = 320;
  const tooltipHeight = 190;
  const gap = 20;
  let top = targetRect ? targetRect.bottom + gap : window.innerHeight / 2 - tooltipHeight / 2;
  let left = targetRect ? targetRect.left + targetRect.width / 2 - tooltipWidth / 2 : window.innerWidth / 2 - tooltipWidth / 2;
  if (step.placement === 'top' && targetRect) top = targetRect.top - tooltipHeight - gap;
  if (step.placement === 'left' && targetRect) {
    top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
    left = targetRect.left - tooltipWidth - gap;
  }
  if (step.placement === 'right' && targetRect) {
    top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
    left = targetRect.right + gap;
  }
  top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
  left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

  const next = () => {
    if (currentStep >= steps.length - 1) endTour(true);
    else setCurrentStep((value) => value + 1);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60" aria-hidden="true" />
      {targetRect ? (
        <div
          className="pointer-events-none fixed z-[101] rounded-xl border-4 border-orange-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]"
          style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16 }}
        />
      ) : null}
      <div className="fixed z-[102] w-80 overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ top, left }} role="dialog" aria-modal="true" aria-label={`Tour step ${currentStep + 1} of ${steps.length}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="font-black text-slate-950">{tour.name}</p>
            <p className="text-xs font-semibold text-slate-600">Step {currentStep + 1} of {steps.length}</p>
          </div>
          <button type="button" onClick={() => endTour(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close tour"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-black text-slate-950">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{step.content}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex gap-2">
            {currentStep > 0 ? <button type="button" onClick={() => setCurrentStep((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-white"><ChevronLeft className="h-4 w-4" /> Back</button> : null}
            {currentStep === steps.length - 1 ? <button type="button" onClick={() => setCurrentStep(0)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white"><RotateCcw className="h-4 w-4" /> Restart</button> : null}
          </div>
          <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-black text-white hover:bg-orange-700">
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </>
  );
}

export function useTour() {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const startTour = useCallback((tourId: string) => setActiveTourId(tourId), []);
  const endTour = useCallback(() => setActiveTourId(null), []);
  return { activeTourId, startTour, endTour };
}
