
"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  CreditCard,
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
CheckCircle, } from 'lucide-react';

interface PayrollSetupFormProps {
  user: any;
  profile: any;
  rateConfigs: any[];
  existingProfile: any;
}

export default function PayrollSetupForm({
  user,
  profile,
  rateConfigs,
  existingProfile,
}: PayrollSetupFormProps) {
  const router = useRouter();

  const [payoutMethod, setPayoutMethod] = useState(
    existingProfile?.payout_method || 'STRIPE'
  );
  const [rate, setRate] = useState(existingProfile?.rate || '');
  const [taxIdUploaded, setTaxIdUploaded] = useState(
    existingProfile?.tax_id_uploaded || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const rateConfig = rateConfigs.find(
    (rc) => rc.payment_type === getPaymentType(profile.role)
  );

  function getPaymentType(role: string): string {
    if (role === 'SITE_COORDINATOR') return 'FLAT';
    return 'PERCENTAGE';
  }

  function getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      PROGRAM_HOLDER: 'Full program management (classroom + hands-on)',
      WORKSITE_ONLY: 'Hands-on supervision only',
      SITE_COORDINATOR: 'Student oversight and compliance monitoring',
    };
    return descriptions[role] || '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate rate
      if (!rate || parseFloat(rate) <= 0) {
        throw new Error('Please enter a valid rate');
      }

      if (rateConfig) {
        const rateNum = parseFloat(rate);
        if (rateNum < rateConfig.min_rate || rateNum > rateConfig.max_rate) {
          throw new Error(
            `Rate must be between ${rateConfig.min_rate} and ${rateConfig.max_rate}`
          );
        }
      }

      if (!taxIdUploaded) {
        throw new Error('Please upload your W-9 tax form');
      }

      const response = await fetch('/api/onboarding/payroll-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: profile.role,
          paymentType: getPaymentType(profile.role),
          rate: parseFloat(rate),
          payoutMethod,
          taxIdUploaded,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save payroll profile');
      }

      setSuccess(true);

      // Redirect back to onboarding after 2 seconds
      setTimeout(() => {
        router.push('/onboarding/start');
      }, 2000);
    } catch (err: any) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h2 className="text-2xl font-bold text-black mb-2">
            Payroll Setup Complete!
          </h2>
          <p className="text-black mb-4">
            Your payroll profile has been submitted for approval.
          </p>
          <p className="text-sm text-slate-500">
            Redirecting you back to onboarding...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-brand-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">
                Payroll Setup
              </h1>
              <p className="text-black mt-1">
                Configure your payment method and tax information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8"
        >
          {/* Role & Rate Info */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brand-blue-900 mb-2">
              Your Role: {profile.role.replace(/_/g, ' ')}
            </h3>
            <p className="text-brand-blue-800 mb-4">
              {getRoleDescription(profile.role)}
            </p>
            {rateConfig && (
              <div className="bg-white rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-black">Minimum</div>
                    <div className="text-lg font-bold text-black">
                      {rateConfig.payment_type === 'PERCENTAGE'
                        ? `${rateConfig.min_rate}%`
                        : `$${rateConfig.min_rate}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-black">Default</div>
                    <div className="text-lg font-bold text-brand-blue-600">
                      {rateConfig.payment_type === 'PERCENTAGE'
                        ? `${rateConfig.default_rate}%`
                        : `$${rateConfig.default_rate}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-black">Maximum</div>
                    <div className="text-lg font-bold text-black">
                      {rateConfig.payment_type === 'PERCENTAGE'
                        ? `${rateConfig.max_rate}%`
                        : `$${rateConfig.max_rate}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Rate */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Your Rate{' '}
              {rateConfig?.payment_type === 'PERCENTAGE'
                ? '(%)'
                : '($ per month)'}
            </label>
            <input
              type="number"
              step="0.01"
              min={rateConfig?.min_rate}
              max={rateConfig?.max_rate}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              Content={rateConfig?.default_rate?.toString() || '0'}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              required
            />
            {rateConfig && (
              <p className="text-sm text-black mt-2">
                Enter a rate between {rateConfig.min_rate} and{' '}
                {rateConfig.max_rate}
                {rateConfig.payment_type === 'PERCENTAGE' ? '%' : ' dollars'}
              </p>
            )}
          </div>

          {/* Payout Method */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Payout Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPayoutMethod('STRIPE')}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
                  payoutMethod === 'STRIPE'
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <CreditCard
                  className={`w-6 h-6 flex-shrink-0 ${
                    payoutMethod === 'STRIPE'
                      ? 'text-brand-blue-600'
                      : 'text-slate-400'
                  }`}
                />
                <div>
                  <div
                    className={`font-semibold ${
                      payoutMethod === 'STRIPE'
                        ? 'text-brand-blue-900'
                        : 'text-black'
                    }`}
                  >
                    Stripe Connect
                  </div>
                  <div className="text-sm text-black mt-1">
                    Fast, secure payments to your bank account or debit card
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('ACH')}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
                  payoutMethod === 'ACH'
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <Building2
                  className={`w-6 h-6 flex-shrink-0 ${
                    payoutMethod === 'ACH'
                      ? 'text-brand-blue-600'
                      : 'text-slate-400'
                  }`}
                />
                <div>
                  <div
                    className={`font-semibold ${
                      payoutMethod === 'ACH'
                        ? 'text-brand-blue-900'
                        : 'text-black'
                    }`}
                  >
                    ACH Transfer
                  </div>
                  <div className="text-sm text-black mt-1">
                    Direct deposit to your bank account (3-5 business days)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* W-9 Upload */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              W-9 Tax Form
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                taxIdUploaded
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-300 bg-slate-50'
              }`}
            >
              {taxIdUploaded ? (
                <div className="flex items-center justify-center gap-3 text-green-700">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="font-medium">W-9 Uploaded</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-black mb-2">
                    Upload your completed W-9 form
                  </p>
                  <a
                    href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue-600 hover:text-brand-blue-700 text-sm underline"
                  >
                    Download W-9 Form
                  </a>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTaxIdUploaded(!taxIdUploaded)}
              className="mt-3 text-sm text-brand-blue-600 hover:text-brand-blue-700 underline"
            >
              {taxIdUploaded ? 'Remove W-9' : 'Mark as Uploaded (Demo)'}
            </button>
          </div>

          {/* Payment Terms */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-black mb-3">Payment Terms</h3>
            <ul className="space-y-2 text-sm text-black">
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600 mt-0.5">•</span>
                <span>Payments are processed monthly, in arrears</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600 mt-0.5">•</span>
                <span>
                  Payment is contingent on verified hours/progress and
                  compliance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600 mt-0.5">•</span>
                <span>1099 tax form will be issued annually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600 mt-0.5">•</span>
                <span>
                  Your payroll profile must be approved by Elevate for Humanity
                  admin
                </span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !taxIdUploaded}
              className="flex-1 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
