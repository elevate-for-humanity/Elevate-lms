"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CertificateVerificationForm() {
  const router = useRouter();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Clean up certificate number
    const cleanNumber = certificateNumber.trim().toUpperCase();

    if (!cleanNumber) {
      setError('Please enter a certificate number');
      setLoading(false);
      return;
    }

    // Validate format (EFH-YYYY-XXXXXXXX)
    const formatRegex = /^EFH-\d{4}-[A-Z0-9]{8}$/;
    if (!formatRegex.test(cleanNumber)) {
      setError(
        'Invalid certificate number format. Expected format: EFH-YYYY-XXXXXXXX'
      );
      setLoading(false);
      return;
    }

    // Redirect to verification page
    router.push(`/verify/${cleanNumber}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-8">
      <div className="text-center mb-6">
        <div className="inline-block p-4 bg-brand-blue-100 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-brand-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black">
          Enter Certificate Number
        </h2>
        <p className="text-black mt-2">
          Enter the certificate number to verify its authenticity
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label
            htmlFor="certificateNumber"
            className="block text-sm font-medium text-black mb-2"
          >
            Certificate Number
          </label>
          <input
            type="text"
            id="certificateNumber"
            value={certificateNumber}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setCertificateNumber(e.target.value.toUpperCase())}
            placeholder="EFH-2024-XXXXXXXX"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-center text-lg font-mono"
            maxLength={20}
          />
          <p className="mt-2 text-xs text-black text-center">
            Format: EFH-YYYY-XXXXXXXX (e.g., EFH-2024-A1B2C3D4)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Certificate'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-brand-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-black">
            <p className="font-semibold mb-1">
              Verification is instant and secure
            </p>
            <p>
              Our system will check the certificate against our database and
              display the verification results immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
