'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { destinationTours, GUIDE_STORAGE_KEYS, GUIDE_ANALYTICS } from '@/lib/guide/flows';

interface GuidedTourProps {
  tourId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export default function GuidedTour({ tourId, onComplete, onSkip, autoStart = false }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tour = destinationTours[tourId];
  const steps = tour?.steps || [];
  const currentStepData = steps[currentStep];

  // Check if tour was already completed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const completed = localStorage.getItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId));
    if (completed && !autoStart) return;

    if (autoStart) {
      startTour();
    }
  }, [tourId, autoStart]);

  // Update target element position
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 180;
        const padding = 16;
        const arrowSize = 12;

        let top = 0;
        let left = 0;

        switch (currentStepData.placement) {
          case 'bottom':
            top = rect.bottom + arrowSize + padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'top':
            top = rect.top - tooltipHeight - arrowSize - padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - arrowSize - padding;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + arrowSize + padding;
            break;
        }

        // Keep tooltip in viewport
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

        setTooltipPosition({ top, left });

        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, currentStepData]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    // console.log(GUIDE_ANALYTICS.TOUR_STARTED, { tourId });
  }, [tourId]);

  const endTour = useCallback((completed: boolean) => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetRect(null);

    if (completed) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUIDE_STORAGE_KEYS.TOUR_COMPLETED(tourId), 'true');
      }
      // console.log(GUIDE_ANALYTICS.TOUR_COMPLETED, { tourId });
      onComplete?.();
    } else {
      onSkip?.();
    }
  }, [tourId, onComplete, onSkip]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour(true);
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          endTour(false);
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTour]);

  if (!isActive || !tour) return null;

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border */}
        {targetRect && (
          <div
            className="absolute border-2 border-orange-500 rounded-xl pointer-events-none animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[101] w-80 bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        role="dialog"
        aria-label={`Tour step ${currentStep + 1} of ${steps.length}`}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{tour.name}</span>
            <span className="text-xs text-slate-500">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={() => endTour(false)}
            className="p-1 hover:bg-slate-100 rounded transition"
            aria-label="Close tour"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-black text-lg mb-2">
            {currentStepData?.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentStepData?.content}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-orange-500 w-4'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button
                onClick={restartTour}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>
            )}
          </div>
          <button
            onClick={nextStep}
            className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}

// Export a hook for programmatic tour control
export function useTour() {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  const startTour = useCallback((tourId: string) => {
    setActiveTourId(tourId);
  }, []);

  const endTour = useCallback(() => {
    setActiveTourId(null);
  }, []);

  return { activeTourId, startTour, endTour };
}
