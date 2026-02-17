'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TransitionButtonsProps {
  applicationType: string;
  applicationId: string;
  currentState: string;
}

const stateTransitions: Record<string, string[]> = {
  submitted: ['in_review', 'rejected'],
  pending: ['in_review', 'rejected'],
  in_review: ['approved', 'rejected'],
  started: ['submitted'],
  review_ready: ['approved', 'rejected'],
};

const stateButtonLabels: Record<string, string> = {
  in_review: 'Mark In Review',
  approved: 'Approve',
  rejected: 'Reject',
  submitted: 'Submit',
};

const stateButtonColors: Record<string, string> = {
  in_review: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white',
  approved: 'bg-brand-green-600 hover:bg-brand-green-700 text-white',
  rejected: 'bg-brand-red-600 hover:bg-brand-red-700 text-white',
  submitted: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white',
};

export default function TransitionButtons({
  applicationType,
  applicationId,
  currentState,
}: TransitionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const availableTransitions = stateTransitions[currentState] || [];

  if (availableTransitions.length === 0) {
    return null;
  }

  const handleTransition = async (newState: string) => {
    setLoading(newState);
    setError(null);

    try {
      const response = await fetch('/api/admin/applications/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_type: applicationType,
          application_id: applicationId,
          new_state: newState,
          reason: `Admin changed state to ${newState}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update state');
      }

      router.refresh();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((state) => (
          <button
            key={state}
            onClick={() => handleTransition(state)}
            disabled={loading !== null}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${stateButtonColors[state] || 'bg-gray-600 hover:bg-gray-700 text-white'}`}
          >
            {loading === state ? 'Updating...' : stateButtonLabels[state] || state}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-brand-red-600">{error}</p>
      )}
    </div>
  );
}
