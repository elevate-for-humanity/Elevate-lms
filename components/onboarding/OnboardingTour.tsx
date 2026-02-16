"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TourStep = {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

type OnboardingTourProps = {
  steps: TourStep[];
  tourKey: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  delay?: number;
};

export function OnboardingTour({ 
  steps, 
  tourKey, 
  onComplete, 
  onSkip,
  autoStart = true,
  delay = 1000 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user has completed this tour
  const checkTourStatus = useCallback(async () => {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        // Check database for tour completion
        const { data: tourRecord } = await supabase
          .from('user_onboarding')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('tour_key', tourKey)
          .single();

        if (tourRecord?.completed_at) {
          setLoading(false);
          return; // Tour already completed
        }
      } else {
        // Check localStorage for non-authenticated users
        const hasSeenTour = localStorage.getItem(`tour_${tourKey}_completed`);
        if (hasSeenTour) {
          setLoading(false);
          return;
        }
      }

      // Show tour after delay
      if (autoStart) {
        setTimeout(() => {
          setIsVisible(true);
          setLoading(false);
        }, delay);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking tour status:', err);
      setLoading(false);
    }
  }, [tourKey, autoStart, delay]);

  useEffect(() => {
    checkTourStatus();
  }, [checkTourStatus]);

  // Save tour completion
  const saveTourCompletion = async (skipped: boolean = false) => {
    const supabase = createClient();

    try {
      if (userId) {
        // Save to database for authenticated users
        await supabase.from('user_onboarding').upsert({
          user_id: userId,
          tour_key: tourKey,
          completed_at: new Date().toISOString(),
          skipped,
          steps_viewed: currentStep + 1,
          total_steps: steps.length,
        });

        // Log activity
        await supabase.from('user_activity').insert({
          user_id: userId,
          activity_type: skipped ? 'tour_skipped' : 'tour_completed',
          metadata: { tour_key: tourKey, steps_viewed: currentStep + 1 },
        }).catch(() => {});
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem(`tour_${tourKey}_completed`, 'true');
      }
    } catch (err) {
      console.error('Error saving tour completion:', err);
      // Fallback to localStorage
      localStorage.setItem(`tour_${tourKey}_completed`, 'true');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = async () => {
    await saveTourCompletion(false);
    setIsVisible(false);
    onComplete?.();
  };

  const skipTour = async () => {
    await saveTourCompletion(true);
    setIsVisible(false);
    onSkip?.();
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  // Public method to manually start tour
  const startTour = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  if (loading || !isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-300" 
        onClick={skipTour}
      />

      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-brand-blue-500" />
                  <span className="text-sm font-medium text-brand-blue-600">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
              </div>
              <button
                onClick={skipTour}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close tour"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-600 leading-relaxed mb-6">{step.description}</p>

            {/* Step Action */}
            {step.action && (
              <div className="mb-6">
                {step.action.href ? (
                  <a
                    href={step.action.href}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg hover:bg-brand-blue-100 transition text-sm font-medium"
                  >
                    {step.action.label}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={step.action.onClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg hover:bg-brand-blue-100 transition text-sm font-medium"
                  >
                    {step.action.label}
                  </button>
                )}
              </div>
            )}

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-brand-blue-600'
                      : index < currentStep
                      ? 'bg-brand-blue-400'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={skipTour}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition flex items-center gap-1"
                >
                  {currentStep < steps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Get Started
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Predefined tours for different pages
export const dashboardTour: TourStep[] = [
  {
    target: 'welcome',
    title: 'Welcome to Your Dashboard!',
    description: 'This is your learning hub. Here you can see your progress, continue courses, and access all learning resources.',
  },
  {
    target: 'progress',
    title: 'Track Your Progress',
    description: 'View your active courses, certificates earned, and average scores at a glance. Your learning journey is visualized here.',
  },
  {
    target: 'continue-learning',
    title: 'Continue Where You Left Off',
    description: 'Quickly resume your courses right where you stopped. Click the play button to jump back in.',
    action: {
      label: 'View My Courses',
      href: '/lms/courses',
    },
  },
  {
    target: 'quick-access',
    title: 'Quick Access Tools',
    description: 'Access forums, study groups, AI tutor, and analytics with one click. These tools help you learn more effectively.',
  },
  {
    target: 'notifications',
    title: 'Stay Updated',
    description: 'Check your notifications for course updates, messages from instructors, and important announcements.',
  },
];

export const coursesTour: TourStep[] = [
  {
    target: 'search',
    title: 'Find Your Perfect Course',
    description: 'Use the search bar to find courses by name, topic, or instructor. Our catalog has hundreds of courses to choose from.',
  },
  {
    target: 'filters',
    title: 'Filter and Sort',
    description: 'Narrow down courses by category, level, duration, and more. Find exactly what you need.',
  },
  {
    target: 'enroll',
    title: 'Enroll in Courses',
    description: 'Click on any course to see details and enroll. Most courses are free with WIOA funding!',
    action: {
      label: 'Browse Programs',
      href: '/programs',
    },
  },
];

export const forumsTour: TourStep[] = [
  {
    target: 'forums',
    title: 'Join the Discussion',
    description: 'Connect with fellow learners, ask questions, and share knowledge in course-specific forums.',
  },
  {
    target: 'create-thread',
    title: 'Start a Conversation',
    description: 'Create new discussion threads to ask questions or share insights. Our community is here to help.',
  },
  {
    target: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified when someone replies to your posts or mentions you.',
  },
];

export const enrollmentTour: TourStep[] = [
  {
    target: 'eligibility',
    title: 'Check Your Eligibility',
    description: 'First, we\'ll check if you qualify for free training through WIOA, JRI, or other funding programs.',
  },
  {
    target: 'program-selection',
    title: 'Choose Your Program',
    description: 'Select from 50+ career training programs in healthcare, skilled trades, technology, and more.',
  },
  {
    target: 'documents',
    title: 'Upload Documents',
    description: 'Provide required documents like ID and proof of eligibility. We\'ll guide you through each step.',
  },
  {
    target: 'orientation',
    title: 'Complete Orientation',
    description: 'Watch a short orientation video to learn about program expectations and support services.',
  },
];

export default OnboardingTour;
