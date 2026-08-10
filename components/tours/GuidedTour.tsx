'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  autoStart?: boolean;
  showOnce?: boolean;
}

export function GuidedTour({ tourId, steps, onComplete, autoStart = false, showOnce = true }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const storageKey = `tour_completed_${tourId}`;

  const handleComplete = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetRect(null);
    if (showOnce) localStorage.setItem(storageKey, 'true');
    onComplete?.();
  }, [onComplete, showOnce, storageKey]);

  const startTour = useCallback(() => {
    if (steps.length === 0) return;
    setCurrentStep(0);
    setIsActive(true);
  }, [steps.length]);

  useEffect(() => {
    if (!autoStart || steps.length === 0) return;
    if (!showOnce || !localStorage.getItem(storageKey)) startTour();
  }, [autoStart, showOnce, startTour, steps.length, storageKey]);

  useEffect(() => {
    if (!isActive) return undefined;
    const step = steps[currentStep];
    if (!step) return undefined;
    const selector = `[data-tour="${step.target}"]`;
    const update = () => {
      const element = document.querySelector(selector);
      setTargetRect(element?.getBoundingClientRect() ?? null);
    };
    update();
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [currentStep, isActive, steps]);

  if (!isActive) {
    return (
      <button type="button" onClick={startTour} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-purple-700 px-4 py-3 text-white shadow-lg hover:bg-purple-800" aria-label="Start guided tour">
        <HelpCircle className="h-5 w-5" /><span className="text-sm font-bold">Need help?</span>
      </button>
    );
  }

  const step = steps[currentStep];
  if (!step) return null;
  const finishOrNext = () => currentStep >= steps.length - 1 ? handleComplete() : setCurrentStep((value) => value + 1);

  const style: React.CSSProperties = { position: 'fixed', zIndex: 9999, width: 360, maxWidth: 'calc(100vw - 32px)' };
  if (!targetRect) {
    style.top = '50%'; style.left = '50%'; style.transform = 'translate(-50%, -50%)';
  } else {
    const gap = 16;
    const position = step.position ?? 'bottom';
    if (position === 'top') { style.bottom = window.innerHeight - targetRect.top + gap; style.left = targetRect.left + targetRect.width / 2; style.transform = 'translateX(-50%)'; }
    if (position === 'bottom') { style.top = targetRect.bottom + gap; style.left = targetRect.left + targetRect.width / 2; style.transform = 'translateX(-50%)'; }
    if (position === 'left') { style.top = targetRect.top + targetRect.height / 2; style.right = window.innerWidth - targetRect.left + gap; style.transform = 'translateY(-50%)'; }
    if (position === 'right') { style.top = targetRect.top + targetRect.height / 2; style.left = targetRect.right + gap; style.transform = 'translateY(-50%)'; }
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[9997] cursor-default bg-black/55" onClick={handleComplete} aria-label="Close guided tour" />
      {targetRect ? <div className="pointer-events-none fixed z-[9998] rounded-lg ring-4 ring-purple-500 ring-offset-4" style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }} /> : null}
      <div style={style} className="rounded-xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-wide text-purple-700">Step {currentStep + 1} of {steps.length}</p><h3 className="mt-1 text-lg font-black text-slate-950">{step.title}</h3></div>
          <button type="button" onClick={handleComplete} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close tour"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-700">{step.content}</p>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={handleComplete} className="text-sm font-bold text-slate-600 hover:text-slate-950">Skip tour</button>
          <div className="flex gap-2">
            {currentStep > 0 ? <button type="button" onClick={() => setCurrentStep((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" />Back</button> : null}
            <button type="button" onClick={finishOrNext} className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-4 py-2 text-sm font-black text-white hover:bg-purple-800">{currentStep === steps.length - 1 ? 'Finish' : 'Next'}{currentStep < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export const PROGRAMS_HUB_TOUR_STEPS: TourStep[] = [
  { target: 'programs-hero', title: 'Welcome to Programs', content: 'This is where you can explore all our training programs. Each program leads to a credential or certification.', position: 'bottom' },
  { target: 'programs-categories', title: 'Browse by Category', content: 'Programs are organized by industry. Click a category to see available programs in that field.', position: 'top' },
  { target: 'programs-apprenticeship', title: 'Apprenticeship Programs', content: 'Apprenticeships let you earn while you learn. You get paid on-the-job training plus classroom instruction.', position: 'right' },
  { target: 'programs-cta', title: 'Ready to Start?', content: 'Click any program to see full details, pricing, and enrollment steps. Questions? Use the chat button.', position: 'top' },
];

export const BARBER_PAGE_TOUR_STEPS: TourStep[] = [
  { target: 'barber-hero', title: 'Barber Apprenticeship', content: 'This is a DOL-registered apprenticeship. You earn while you learn at a real barbershop.', position: 'bottom' },
  { target: 'barber-pricing', title: 'Pricing & Payment', content: 'Review current tuition and payment details before enrollment.', position: 'top' },
  { target: 'barber-transfer', title: 'Transfer Hours', content: 'Already have barber training hours? Submit evidence so eligible prior hours can be reviewed.', position: 'right' },
  { target: 'barber-partner', title: 'For Shop Owners', content: 'Own a barbershop? You can apply to become a Host Shop and train apprentices.', position: 'top' },
];
