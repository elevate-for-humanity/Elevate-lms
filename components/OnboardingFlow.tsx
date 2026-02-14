"use client";

import React from 'react';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
}

export function OnboardingFlow({ steps, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">
              Welcome to Elevate for Humanity
            </h2>
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-black"
            >
              Skip tour
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-xs ${
                    index === currentStep
                      ? 'text-brand-orange-600 font-semibold'
                      : completedSteps.has(index)
                      ? 'text-brand-orange-600'
                      : 'text-slate-400'
                  }`}
                >
                  {completedSteps.has(index) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-black mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-black">
              {steps[currentStep].description}
            </p>
          </div>
          <div className="mt-6">
            {steps[currentStep].content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-black hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Student Onboarding
export function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Let\'s get you started with your learning journey',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <h4 className="text-lg font-semibold text-emerald-900 mb-2">
              🎓 Welcome to Your Learning Platform
            </h4>
            <p className="text-red-700">
              Access free career training, earn certificates, and connect with employers.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-orange-600">12+</div>
              <div className="text-sm text-black">Programs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-orange-600">100%</div>
              <div className="text-sm text-black">Free</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-orange-600">85%</div>
              <div className="text-sm text-black">Job Placement</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'Navigate your learning hub',
      content: (
        <div className="space-y-4">
          <p className="text-black">
            Your dashboard is your home base. Here you can:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>View your enrolled courses and progress</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Access upcoming assignments and deadlines</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Track your achievements and certificates</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Message instructors and classmates</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'courses',
      title: 'Browse Courses',
      description: 'Find the perfect program for you',
      content: (
        <div className="space-y-4">
          <p className="text-black">
            Explore our programs in:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-blue-50 rounded-lg p-4">
              <div className="font-semibold text-brand-blue-900">Healthcare</div>
              <div className="text-sm text-brand-blue-700">Medical Assistant, CNA, Home Health Aide</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="font-semibold text-purple-900">Skilled Trades</div>
              <div className="text-sm text-purple-700">HVAC, Building Maintenance</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="font-semibold text-orange-900">Transportation</div>
              <div className="text-sm text-orange-700">CDL Training</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-semibold text-green-900">Personal Services</div>
              <div className="text-sm text-green-700">Barber Apprenticeship</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'support',
      title: 'Get Support',
      description: 'We\'re here to help you succeed',
      content: (
        <div className="space-y-4">
          <p className="text-black">
            Need help? We've got you covered:
          </p>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="font-semibold text-black mb-1">💬 Live Chat</div>
              <div className="text-sm text-black">Get instant answers from our support team</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="font-semibold text-black mb-1">📧 Email Support</div>
              <div className="text-sm text-black">elevate4humanityedu@gmail.com</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="font-semibold text-black mb-1">📚 Help Center</div>
              <div className="text-sm text-black">Browse FAQs and guides</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return <OnboardingFlow steps={steps} onComplete={onComplete} />;
}

// Instructor Onboarding
export function InstructorOnboarding({ onComplete }: { onComplete: () => void }) {
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome Instructor',
      description: 'Let\'s set up your teaching environment',
      content: (
        <div className="space-y-4">
          <div className="bg-brand-blue-50 rounded-lg p-6 text-center">
            <h4 className="text-lg font-semibold text-brand-blue-900 mb-2">
              👨‍🏫 Welcome to Your Instructor Portal
            </h4>
            <p className="text-brand-blue-700">
              Manage courses, grade assignments, and engage with students.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'courses',
      title: 'Manage Courses',
      description: 'Create and organize your courses',
      content: (
        <div className="space-y-4">
          <p className="text-black">As an instructor, you can:</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>Create and manage course content</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>Upload videos, documents, and assignments</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>Track student progress and engagement</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'grading',
      title: 'Grade & Feedback',
      description: 'Evaluate student work efficiently',
      content: (
        <div className="space-y-4">
          <p className="text-black">Streamlined grading tools:</p>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="font-semibold text-black mb-2">Quick Grading</div>
            <div className="text-sm text-black">Grade assignments with rubrics and provide detailed feedback</div>
          </div>
        </div>
      ),
    },
  ];

  return <OnboardingFlow steps={steps} onComplete={onComplete} />;
}
