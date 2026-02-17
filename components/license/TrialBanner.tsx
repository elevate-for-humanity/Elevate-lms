'use client';

import Link from 'next/link';
import { Clock, AlertTriangle, X, CreditCard } from 'lucide-react';
import { LicenseStatus, License, getStatusMessage, getStatusBannerType } from '@/lib/license/types';

interface LicenseBannerProps {
  license: License;
  onDismiss?: () => void;
}

/**
 * License Status Banner
 * 
 * Displays license status messaging based on subscription state:
 * - Trial: Shows days remaining
 * - Active: No banner
 * - Past Due: Payment warning
 * - Suspended/Canceled: Access locked message
 */
export function LicenseBanner({ license, onDismiss }: LicenseBannerProps) {
  const bannerType = getStatusBannerType(license.status);
  
  // Active users see no banner
  if (!bannerType) {
    return null;
  }

  const message = getStatusMessage(license);

  // Trial Banner
  if (license.status === 'trial') {
    const daysRemaining = license.trialEndsAt 
      ? Math.ceil((license.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="bg-brand-blue-50 border-b border-brand-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <div>
                <span className="font-semibold text-brand-blue-900">Trial Mode</span>
                <span className="text-brand-blue-700 ml-2">
                  You are evaluating the Elevate Workforce Platform.
                </span>
                <span className="text-brand-blue-900 font-medium ml-2">
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/account/billing"
                className="bg-brand-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
              >
                Manage Billing
              </Link>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-brand-blue-400 hover:text-brand-blue-600"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-brand-blue-600 mt-1 ml-8">
            Your card will be charged automatically when the trial ends.
          </p>
        </div>
      </div>
    );
  }

  // Past Due Banner
  if (license.status === 'past_due') {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <div>
                <span className="font-semibold text-amber-900">Payment Issue</span>
                <span className="text-amber-700 ml-2">
                  Your last payment failed. Please update your billing information.
                </span>
              </div>
            </div>
            <Link
              href="/account/billing"
              className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
            >
              Update Payment Method
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Suspended/Canceled Banner
  if (license.status === 'suspended' || license.status === 'canceled') {
    return (
      <div className="bg-brand-red-50 border-b border-brand-red-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-red-600" />
              <div>
                <span className="font-semibold text-brand-red-900">
                  {license.status === 'suspended' ? 'License Suspended' : 'License Canceled'}
                </span>
                <span className="text-brand-red-700 ml-2">
                  Administrative actions are disabled.
                </span>
              </div>
            </div>
            <Link
              href="/store"
              className="bg-brand-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-brand-red-700 transition-colors"
            >
              Reactivate License
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Compact License Badge
 * For use in headers or sidebars
 */
export function LicenseBadge({ status, trialEndsAt }: { status: LicenseStatus; trialEndsAt?: Date | null }) {
  if (status === 'active') return null;

  if (status === 'trial' && trialEndsAt) {
    const daysRemaining = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-medium rounded-full">
        <Clock className="w-3 h-3" />
        Trial: {daysRemaining}d
      </span>
    );
  }

  if (status === 'past_due') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
        <CreditCard className="w-3 h-3" />
        Past Due
      </span>
    );
  }

  if (status === 'suspended' || status === 'canceled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-red-100 text-brand-red-700 text-xs font-medium rounded-full">
        <AlertTriangle className="w-3 h-3" />
        {status === 'suspended' ? 'Suspended' : 'Canceled'}
      </span>
    );
  }

  return null;
}

/**
 * Trial Expiration Modal
 * Shows when trial has just expired
 */
export function TrialExpiredModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-brand-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Trial Period Ended
          </h2>
          <p className="text-gray-600 mb-6">
            Your evaluation period has ended. To continue using the Elevate Workforce Platform, 
            your subscription will now begin.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Your data has been preserved. No information has been deleted.
          </p>
          <div className="space-y-3">
            <Link
              href="/account/billing"
              className="block w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Manage Billing
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
