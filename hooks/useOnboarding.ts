'use client';

import { useState, useEffect } from 'react';
import { OnboardingFlow } from '@/lib/onboarding';

export function useOnboarding(userId: string, userRole: 'student' | 'instructor' | 'admin') {
  const [recommendedFlows, setRecommendedFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const response = await fetch('/api/onboarding?action=recommended');
        if (!response.ok) throw new Error('Failed to fetch onboarding');

        const data = await response.json();
        setRecommendedFlows(data.recommended || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchRecommended();
    }
  }, [userId]);

  const startFlow = async (flowId: string) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', flowId }),
      });

      if (!response.ok) throw new Error('Failed to start onboarding');
      return true;
    } catch (err) {
      return false;
    }
  };

  const completeFlow = async (flowId: string) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', flowId }),
      });

      if (!response.ok) throw new Error('Failed to complete onboarding');

      // Remove from recommended flows
      setRecommendedFlows((flows) => flows.filter((f) => f.id !== flowId));
      return true;
    } catch (err) {
      return false;
    }
  };

  const skipFlow = async (flowId: string) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', flowId }),
      });

      if (!response.ok) throw new Error('Failed to skip onboarding');

      // Remove from recommended flows
      setRecommendedFlows((flows) => flows.filter((f) => f.id !== flowId));
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    recommendedFlows,
    loading,
    error,
    startFlow,
    completeFlow,
    skipFlow,
    hasRecommendedFlows: recommendedFlows.length > 0,
  };
}
