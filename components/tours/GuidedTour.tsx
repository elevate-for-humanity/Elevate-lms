'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

export interface TourStep {
  target: string; // data-tour attribute value
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

export function GuidedTour({ 
  tourId, 
  steps, 
  onComplete, 
  autoStart = false,
  showOnce = true 
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const storageKey = `tour_completed_${tourId}`;

  useEffect(() => {
    if (autoStart && showOnce) {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        setIsActive(true);
      }
    } else if (autoStart) {
      setIsActive(true);
    }
  }, [autoStart, showOnce, storageKey]);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    const element = document.querySelector(`[data-tour="${step.target}"]`);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStep, steps]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    if (showOnce) {
      localStorage.setItem(storageKey, 'true');
    }
    onComplete?.();
  }, [showOnce, storageKey, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  if (!isActive) {
    return (
      <button
        onClick={startTour}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-brand-red-600 text-white rounded-full shadow-lg hover:bg-brand-red-700 transition-all"
        aria-label="Start guided tour"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Need help?</span>
      </button>
    );
  }

  const step = steps[currentStep];
  const position = step.position || 'bottom';

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  if (targetRect) {
    const padding = 16;
    switch (position) {
      case 'top':
        tooltipStyle.bottom = `${window.innerHeight - targetRect.top + padding}px`;
        tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        tooltipStyle.top = `${targetRect.bottom + padding}px`;
        tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
      case 'left':
        tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
        tooltipStyle.right = `${window.innerWidth - targetRect.left + padding}px`;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
      case 'right':
        tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
        tooltipStyle.left = `${targetRect.right + padding}px`;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
    }
  } else {
    // Center if no target found
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleSkip}
      />

      {/* Highlight box */}
      {targetRect && (
        <div
          className="fixed z-[9998] ring-4 ring-brand-red-500 ring-offset-4 rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div 
        style={tooltipStyle}
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs text-brand-red-600 font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 text-sm mb-6">{step.content}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Programs Hub Tour Steps
export const PROGRAMS_HUB_TOUR_STEPS: TourStep[] = [
  {
    target: 'programs-hero',
    title: 'Welcome to Programs',
    content: 'This is where you can explore all our training programs. Each program leads to a credential or certification.',
    position: 'bottom',
  },
  {
    target: 'programs-categories',
    title: 'Browse by Category',
    content: 'Programs are organized by industry. Click a category to see available programs in that field.',
    position: 'top',
  },
  {
    target: 'programs-apprenticeship',
    title: 'Apprenticeship Programs',
    content: 'Apprenticeships let you earn while you learn. You get paid on-the-job training plus classroom instruction.',
    position: 'right',
  },
  {
    target: 'programs-cta',
    title: 'Ready to Start?',
    content: 'Click any program to see full details, pricing, and enrollment steps. Questions? Use the chat button.',
    position: 'top',
  },
];

// Barber Page Tour Steps
export const BARBER_PAGE_TOUR_STEPS: TourStep[] = [
  {
    target: 'barber-hero',
    title: 'Barber Apprenticeship',
    content: 'This is a DOL-registered apprenticeship. You earn while you learn at a real barbershop.',
    position: 'bottom',
  },
  {
    target: 'barber-pricing',
    title: 'Pricing & Payment',
    content: 'Total cost is $4,980. You pay a $1,743 setup fee at enrollment, then weekly payments every Friday.',
    position: 'top',
  },
  {
    target: 'barber-transfer',
    title: 'Transfer Hours',
    content: 'Already have barber training hours? You can transfer them in. This may reduce your weekly payment.',
    position: 'right',
  },
  {
    target: 'barber-partner',
    title: 'For Shop Owners',
    content: 'Own a barbershop? You can become a partner and host apprentices. Click here to learn more.',
    position: 'top',
  },
];
