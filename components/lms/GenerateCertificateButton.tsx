"use client";

import React from 'react';

import { useState } from 'react';
import { Award } from 'lucide-react';

type Props = {
  courseId?: number | string;
  enrollmentId?: number | string;
  disabled?: boolean;
  isCompleted?: boolean;
};

export function GenerateCertificateButton({
  courseId,
  enrollmentId,
  disabled,
  isCompleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          enrollmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.message ||
            data?.error ||
            'Unable to generate certificate. Please complete all required lessons first.'
        );
      } else {
        setMessage(
          data?.message ||
            'Certificate generated! You can view it on your Certificates page.'
        );
        // Reload page after 2 seconds to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const effectiveDisabled = disabled || !isCompleted;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={effectiveDisabled || loading}
        className={[
          'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold',
          'transition focus:outline-none focus:ring-2 focus:ring-offset-2',
          effectiveDisabled || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : '    text-white shadow-lg hover:brightness-110 hover:shadow-xl',
        ].join(' ')}
      >
        <Award className="h-5 w-5" />
        {loading ? 'Generating…' : 'Generate Certificate'}
      </button>
      {!isCompleted && (
        <p className="text-xs text-gray-500">
          Complete all required lessons to unlock your certificate.
        </p>
      )}
      {message && (
        <div className="elevate-card bg-green-50 border-green-200 p-3">
          <p className="text-sm text-green-800 font-medium">• {message}</p>
        </div>
      )}
      {error && (
        <div className="elevate-card bg-red-50 border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
