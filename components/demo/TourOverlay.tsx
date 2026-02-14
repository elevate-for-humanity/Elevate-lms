'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Play,
  ExternalLink,
  User,
  RotateCcw
} from 'lucide-react';
import { getTour, getTourStep, getTourStepCount, type TourStep } from '@/lib/demo/tours';
import { 
  getProgress, 
  initProgress, 
  advanceStep, 
  resetProgress,
  type TourProgress 
} from '@/lib/demo/progress';
import { type DemoLicenseType, DEMO_USERS } from '@/lib/demo/context';
import { DemoTrialFunnelEvents } from '@/lib/analytics/events';

interface TourOverlayProps {
  tourId?: DemoLicenseType;
  stepNumber?: number;
}

export function TourOverlay({ tourId: propTourId, stepNumber: propStepNumber }: TourOverlayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get tour info from props or URL params
  const tourId = propTourId || searchParams.get('demoTour') as DemoLicenseType | null;
  const stepParam = propStepNumber || parseInt(searchParams.get('step') || '1', 10);
  
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  
  // Demo user ID (in real app, would come from auth)
  const userId = 'demo-user';
  
  useEffect(() => {
    if (!tourId) return;
    
    // Initialize progress
    const p = initProgress(userId, tourId);
    setProgress(p);
    
    // Track tour start on first step
    if (stepParam === 1) {
      DemoTrialFunnelEvents.demoTourStarted(tourId);
    }
    
    // Get current step
    const step = getTourStep(tourId, stepParam);
    setCurrentStep(step);
  }, [tourId, stepParam]);
  
  if (!tourId || !currentStep) {
    return null;
  }
  
  const tour = getTour(tourId);
  const totalSteps = getTourStepCount(tourId);
  const isLastStep = stepParam >= totalSteps;
  const isFirstStep = stepParam <= 1;
  
  const handleNext = () => {
    if (!progress) return;
    
    // Mark current step complete and advance
    const newProgress = advanceStep(userId, tourId, currentStep.id, totalSteps);
    setProgress(newProgress);
    
    if (isLastStep) {
      DemoTrialFunnelEvents.demoTourCompleted(tourId);
      router.push(currentStep.route);
    } else {
      // Navigate to next step's route with tour params
      const nextStep = getTourStep(tourId, stepParam + 1);
      if (nextStep) {
        router.push(`${nextStep.route}?demoTour=${tourId}&step=${stepParam + 1}`);
      }
    }
  };
  
  const handlePrevious = () => {
    if (isFirstStep) return;
    
    const prevStep = getTourStep(tourId, stepParam - 1);
    if (prevStep) {
      router.push(`${prevStep.route}?demoTour=${tourId}&step=${stepParam - 1}`);
    }
  };
  
  const handleGoToStep = () => {
    router.push(`${currentStep.route}?demoTour=${tourId}&step=${stepParam}`);
  };
  
  const handleReset = () => {
    if (confirm('Reset tour progress? You will start from the beginning.')) {
      resetProgress(userId, tourId);
      router.push(`/demo/tour/${tourId}?step=1`);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    // Remove tour params from URL
    router.push(window.location.pathname);
  };
  
  // Minimized state - just show a small button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-orange-700 transition flex items-center gap-2"
      >
        <Play className="w-5 h-5" />
        <span className="font-semibold">Resume Tour</span>
        <span className="bg-orange-500 px-2 py-0.5 rounded-full text-sm">
          {stepParam}/{totalSteps}
        </span>
      </button>
    );
  }
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop - semi-transparent */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={() => setIsMinimized(true)} />
      
      {/* Overlay Panel */}
      <div className="absolute bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">{tour.name}</div>
              <div className="text-xs text-slate-400">Step {stepParam} of {totalSteps}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
              title="Minimize"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-200">
          <div 
            className="h-full bg-orange-600 transition-all duration-300"
            style={{ width: `${(stepParam / totalSteps) * 100}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step Title */}
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {currentStep.title}
          </h2>
          
          {/* Role Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm mb-4">
            <User className="w-4 h-4" />
            <span>Viewing as: <strong>{DEMO_USERS[currentStep.role]?.name || currentStep.role}</strong></span>
          </div>
          
          {/* Narrative */}
          <div className="prose prose-sm prose-slate mb-6">
            {currentStep.narrative.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-slate-700 leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Why It Matters */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-6">
            <div className="text-xs font-semibold text-brand-blue-800 uppercase tracking-wide mb-1">
              Why This Matters
            </div>
            <p className="text-sm text-brand-blue-900">
              {currentStep.why_it_matters}
            </p>
          </div>
          
          {/* Go to Page Button */}
          <button
            onClick={handleGoToStep}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-3 rounded-xl font-semibold transition mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            Go to {currentStep.title}
          </button>
        </div>
        
        {/* Footer Navigation */}
        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-medium transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition"
                title="Reset tour"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {currentStep.next_button_label}
                </>
              ) : (
                <>
                  {currentStep.next_button_label}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper to conditionally show tour overlay based on URL params
 */
export function TourOverlayWrapper() {
  const searchParams = useSearchParams();
  const tourId = searchParams.get('demoTour') as DemoLicenseType | null;
  
  if (!tourId) return null;
  
  return <TourOverlay />;
}
