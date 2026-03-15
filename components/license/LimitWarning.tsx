'use client';

import Link from 'next/link';
import { AlertTriangle, TrendingUp, Lock, ArrowRight } from 'lucide-react';
import { getLimitReachedMessage, getUpgradePath } from '@/lib/license/limits';
import { PlanId } from '@/lib/license/types';

interface LimitWarningBannerProps {
  planId: PlanId;
  metric: 'students' | 'admins' | 'programs';
  currentUsage: number;
  limit: number;
  percentUsed: number;
}

/**
 * Warning banner when approaching limits (80%+)
 */
export function LimitWarningBanner({
  planId,
  metric,
  currentUsage,
  limit,
  percentUsed,
}: LimitWarningBannerProps) {
  const upgrade = getUpgradePath(planId);
  const isCritical = percentUsed >= 95;

  const metricLabels = {
    students: 'students',
    admins: 'admin users',
    programs: 'programs',
  };

  return (
    <div className={`border-b ${isCritical ? 'bg-brand-red-50 border-brand-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-5 h-5 ${isCritical ? 'text-brand-red-600' : 'text-amber-600'}`} />
            <div>
              <span className={`font-semibold ${isCritical ? 'text-brand-red-900' : 'text-amber-900'}`}>
                {isCritical ? 'Almost at limit' : 'Approaching limit'}
              </span>
              <span className={`ml-2 ${isCritical ? 'text-brand-red-700' : 'text-amber-700'}`}>
                {currentUsage} of {limit} {metricLabels[metric]} ({percentUsed}%)
              </span>
            </div>
          </div>
          <Link
            href={upgrade.ctaHref}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isCritical
                ? 'bg-brand-red-600 text-white hover:bg-brand-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {upgrade.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface LimitReachedModalProps {
  planId: PlanId;
  limitType: 'students' | 'admins' | 'programs' | 'sites';
  planName: string;
  onClose?: () => void;
}

/**
 * Modal shown when a hard limit is reached
 * This blocks the action - no dismiss without upgrade
 */
export function LimitReachedModal({
  planId,
  limitType,
  planName,
  onClose,
}: LimitReachedModalProps) {
  const message = getLimitReachedMessage(limitType, planName);
  const upgrade = getUpgradePath(planId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-brand-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            {message.title}
          </h2>
          <p className="text-gray-600 mb-8">
            {message.body}
          </p>
          <div className="space-y-3">
            <Link
              href={upgrade.ctaHref}
              className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              {message.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="block w-full text-gray-500 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LimitReachedBannerProps {
  planId: PlanId;
  limitType: 'students' | 'admins' | 'programs' | 'sites';
  planName: string;
}

/**
 * Persistent banner when limit is reached
 */
export function LimitReachedBanner({
  planId,
  limitType,
  planName,
}: LimitReachedBannerProps) {
  const message = getLimitReachedMessage(limitType, planName);
  const upgrade = getUpgradePath(planId);

  return (
    <div className="bg-white text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <span className="font-semibold">{message.title}:</span>
              <span className="ml-2 opacity-90">{message.body}</span>
            </div>
          </div>
          <Link
            href={upgrade.ctaHref}
            className="bg-white text-brand-red-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-red-50 transition-colors flex-shrink-0"
          >
            {message.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface UsageIndicatorProps {
  label: string;
  current: number;
  limit: number | 'unlimited';
  showUpgrade?: boolean;
  upgradeHref?: string;
}

/**
 * Usage indicator for dashboards
 */
export function UsageIndicator({
  label,
  current,
  limit,
  showUpgrade = false,
  upgradeHref = '/account/billing',
}: UsageIndicatorProps) {
  if (limit === 'unlimited') {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">{current} (unlimited)</span>
      </div>
    );
  }

  const percent = Math.round((current / limit) * 100);
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;
  const isAtLimit = current >= limit;

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700">{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-brand-red-600' : isCritical ? 'text-brand-red-600' : isWarning ? 'text-amber-600' : 'text-gray-900'}`}>
          {current} / {limit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isAtLimit ? 'bg-brand-red-600' : isCritical ? 'bg-brand-red-500' : isWarning ? 'bg-amber-500' : 'bg-brand-green-500'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {isAtLimit && showUpgrade && (
        <Link
          href={upgradeHref}
          className="mt-2 text-sm text-brand-red-600 font-medium hover:underline inline-flex items-center gap-1"
        >
          Upgrade to add more <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

/**
 * Enterprise feature gate message
 */
export function EnterpriseFeatureGate({ featureName }: { featureName: string }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 text-center">
      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <h3 className="font-bold text-gray-900 mb-2">Enterprise Feature</h3>
      <p className="text-gray-600 text-sm mb-4">
        {featureName} requires an Enterprise license.
      </p>
      <Link
        href="/store/request-license?tier=implementation_plus_annual"
        className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
      >
        Contact Sales
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
