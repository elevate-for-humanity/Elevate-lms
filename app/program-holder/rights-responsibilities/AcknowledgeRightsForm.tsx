"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function AcknowledgeRightsForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setError(
        'You must acknowledge that you have read and understood your rights and responsibilities'
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
      const response = await fetch('/api/program-holder/acknowledge-rights', {
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

      // Show success state — user continues to document upload from the banner
      setDone(true);
    } catch (err: any) {
      setError((err as Error).message || 'Failed to submit acknowledgement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 bg-green-50 border border-green-200 rounded-lg p-5">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Rights &amp; Responsibilities acknowledged</p>
            <p className="text-green-800 text-sm mt-1 leading-relaxed">
              Your acknowledgement has been recorded. One last step — upload your required documents below.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/program-holder/documents?required=true')}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-colors"
        >
          Next: Upload Required Documents
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

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

      <div className="bg-white rounded-lg p-6 border-2 border-brand-blue-300">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-brand-blue-500"
          />
          <span className="text-black font-medium">
            I acknowledge that I have read, understood, and agree to uphold my
            rights and responsibilities as a Program Holder. I understand that
            failure to meet my responsibilities may result in corrective action
            or termination of my agreement.
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-brand-red-50 border-2 border-brand-red-200 rounded-lg p-4">
          <p className="text-brand-red-800 font-medium">{error}</p>
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
        After submitting, you will continue to the document upload step.
      </p>
    </form>
  );
}
