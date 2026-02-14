"use client";

import React from 'react';

import { useState } from 'react';
import { X, Rocket, ChevronRight } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingFlow from '@/components/OnboardingFlow';
import { ONBOARDING_FLOWS } from '@/lib/onboarding';

interface OnboardingPromptProps {
  userId: string;
  userRole: 'student' | 'instructor' | 'admin';
}

export default function OnboardingPrompt({ userId, userRole }: OnboardingPromptProps) {
  const { recommendedFlows, loading, startFlow, skipFlow, hasRecommendedFlows } = useOnboarding(userId, userRole);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (loading || !hasRecommendedFlows || dismissed) {
    return null;
  }

  const primaryFlow = recommendedFlows[0];

  const handleStart = async () => {
    await startFlow(primaryFlow.id);
    setSelectedFlow(primaryFlow.id);
    setShowOnboarding(true);
  };

  const handleDismiss = async () => {
    await skipFlow(primaryFlow.id);
    setDismissed(true);
  };

  const handleComplete = () => {
    setShowOnboarding(false);
    setSelectedFlow(null);
    setDismissed(true);
  };

  if (showOnboarding && selectedFlow) {
    const flow = ONBOARDING_FLOWS[selectedFlow];
    if (flow) {
      return (
        <OnboardingFlow
          flow={flow}
          userId={userId}
          onComplete={handleComplete}
          onSkip={handleComplete}
        />
      );
    }
  }

  return (
    <div className="   rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {primaryFlow.name}
            </h3>
            <p className="text-brand-blue-100 mb-4">
              Take a quick tour to learn how to make the most of your experience.
              It only takes a few minutes!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-2 bg-white text-brand-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Tour
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-2 text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
