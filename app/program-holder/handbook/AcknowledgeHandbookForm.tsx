"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AcknowledgeHandbookForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setError(
        'You must acknowledge that you have read and understood the handbook'
      );
      return;
    }

    if (!fullName || !title) {
      setError('Please provide your full name and title');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/program-holder/acknowledge-handbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit acknowledgement');
      }

      // Success! Redirect to rights & responsibilities
      router.push('/program-holder/rights-responsibilities');
    } catch (err: any) {
      setError((err as Error).message || 'Failed to submit acknowledgement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-black mb-2"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Your full legal name"
        />
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-black mb-2"
        >
          Title/Position *
        </label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Program Director"
        />
      </div>

      <div className="bg-white rounded-lg p-6 border-2 border-slate-300">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-brand-blue-500"
          />
          <span className="text-black font-medium">
            I acknowledge that I have read, understood, and agree to comply with
            all policies and procedures outlined in the Program Holder Employee
            Handbook. I understand that failure to comply may result in
            termination of my Program Holder agreement.
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !agreed}
        className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Acknowledgement'}
      </button>

      <p className="text-sm text-black text-center">
        After submitting, you will be directed to review the Rights &
        Responsibilities document.
      </p>
    </form>
  );
}
