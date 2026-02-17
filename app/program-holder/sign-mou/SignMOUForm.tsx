
"use client";

import React from 'react';

import { useState } from 'react';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { useRouter } from 'next/navigation';

export function SignMOUForm() {
  const router = useRouter();
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureDataUrl) {
      setError('Please provide your signature');
      return;
    }

    if (!agreed) {
      setError('You must agree to the terms');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/program-holder/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl,
          signerName,
          signerTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign MOU');
      }

      // Success! Redirect to dashboard
      router.push('/program-holder/dashboard?mou=signed');
    } catch (err: any) {
      setError((err as Error).message || 'Failed to sign MOU');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Signer Information */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="signerName"
            className="block text-sm font-medium text-black mb-1"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="signerName"
            required
            value={signerName}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setSignerName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Your full legal name"
          />
        </div>

        <div>
          <label
            htmlFor="signerTitle"
            className="block text-sm font-medium text-black mb-1"
          >
            Title/Position *
          </label>
          <input
            type="text"
            id="signerTitle"
            required
            value={signerTitle}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setSignerTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Owner, Manager, Director, etc."
          />
        </div>
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Digital Signature *
        </label>
        <p className="text-sm text-black mb-3">
          Please sign in the box below using your mouse or touchscreen
        </p>
        <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <input
          type="checkbox"
          id="agreed"
          checked={agreed}
          onChange={(
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          ) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 text-brand-blue-600 focus:ring-brand-blue-500 border-slate-300 rounded"
        />
        <label htmlFor="agreed" className="text-sm text-black">
          I have read and agree to the terms of this Memorandum of
          Understanding. I understand that this digital signature is legally
          binding and has the same effect as a handwritten signature.
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
          <p className="text-sm text-brand-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-slate-300 text-black rounded-lg font-semibold hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !signatureDataUrl || !agreed}
          className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Signing...' : 'Sign MOU'}
        </button>
      </div>
    </form>
  );
}
