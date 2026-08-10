'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

type Props = {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  autoStart?: boolean;
  showOnce?: boolean;
};

export function GuidedTour({ tourId, steps, onComplete, autoStart = false, showOnce = true }: Props) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const storageKey = `tour_completed_${tourId}`;

  const finish = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    if (showOnce) localStorage.setItem(storageKey, 'true');
    onComplete?.();
  }, [showOnce, storageKey, onComplete]);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) finish();
    else setStepIndex((value) => value + 1);
  }, [stepIndex, steps.length, finish]);

  useEffect(() => {
    if (!autoStart) return;
    const completed = showOnce ? localStorage.getItem(storageKey) : null;
    if (!completed) setActive(true);
  }, [autoStart, showOnce, storageKey]);

  useEffect(() => {
    if (!active || !steps[stepIndex]) return;
    const element = document.querySelector(`[data-tour="${steps[stepIndex].target}"]`);
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTargetRect(rect);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active, stepIndex, steps]);

  const start = () => {
    setStepIndex(0);
    setActive(true);
  };

  if (!active) {
    return (
      <button type="button" onClick={start} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-white shadow-lg">
        <HelpCircle className="h-5 w-5" /> <span className="text-sm font-medium">Need help?</span>
      </button>
    );
  }

  const step = steps[stepIndex];
  if (!step) return null;

  const style: React.CSSProperties = targetRect
    ? { position: 'fixed', zIndex: 9999, top: Math.min(window.innerHeight - 240, targetRect.bottom + 16), left: Math.min(window.innerWidth - 360, Math.max(16, targetRect.left)) }
    : { position: 'fixed', zIndex: 9999, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <button type="button" aria-label="Close tour" className="fixed inset-0 z-[9998] bg-black/50" onClick={finish} />
      <section style={style} className="w-[calc(100vw-32px)] max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold text-purple-700">Step {stepIndex + 1} of {steps.length}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{step.title}</h3></div>
          <button type="button" onClick={finish} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{step.content}</p>
        <div className="mt-6 flex justify-end gap-2">
          {stepIndex > 0 ? <button type="button" onClick={() => setStepIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold"><ChevronLeft className="h-4 w-4" />Back</button> : null}
          <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white">{stepIndex === steps.length - 1 ? 'Finish' : 'Next'}{stepIndex < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}</button>
        </div>
      </section>
    </>
  );
}

export const PROGRAMS_HUB_TOUR_STEPS: TourStep[] = [
  { target: 'programs-hero', title: 'Welcome to Programs', content: 'Explore training programs that lead to industry credentials and career pathways.', position: 'bottom' },
  { target: 'programs-categories', title: 'Browse by Category', content: 'Programs are organized by industry so you can quickly compare relevant pathways.', position: 'top' },
  { target: 'programs-apprenticeship', title: 'Apprenticeship Programs', content: 'Apprenticeships combine paid on-the-job learning with related technical instruction.', position: 'right' },
  { target: 'programs-cta', title: 'Ready to Start?', content: 'Open a program to review requirements, funding, pricing, and the application path.', position: 'top' },
];

export const BARBER_PAGE_TOUR_STEPS: TourStep[] = [
  { target: 'barber-hero', title: 'Barber Apprenticeship', content: 'Review the apprenticeship structure, training expectations, and host-shop pathway.', position: 'bottom' },
  { target: 'barber-pricing', title: 'Pricing & Payment', content: 'Review the current published tuition and payment options before applying.', position: 'top' },
  { target: 'barber-transfer', title: 'Transfer Hours', content: 'Document eligible prior barber hours for review during enrollment.', position: 'right' },
  { target: 'barber-partner', title: 'For Shop Owners', content: 'Qualified barbershops can apply to become apprenticeship host sites.', position: 'top' },
];
