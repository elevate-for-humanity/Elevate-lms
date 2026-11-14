'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import type { FeatureKey, PlanTier } from '@/lib/subscriptions/feature-access';

interface FeatureGateProps {
  children: ReactNode;
  feature: FeatureKey;
  features: Record<string, boolean> | null;
  planTier?: PlanTier;
  fallback?: ReactNode;
  showUpgradeCard?: boolean;
  compact?: boolean;
}

export function FeatureGate({
  children,
  feature,
  features,
  planTier = 'starter',
  fallback,
  showUpgradeCard = true,
  compact = false,
}: FeatureGateProps) {
  const isEnabled = features?.[feature] ?? false;

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradeCard) {
    return null;
  }

  const requiredPlan = planTier === 'starter' ? 'Professional' : 'Enterprise';

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Lock className="w-4 h-4" />
        <span>Available with {requiredPlan} Plan</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 text-center">
      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Feature Locked
      </h3>
      <p className="text-slate-600 mb-4">
        This feature is available with the <strong>{requiredPlan}</strong> plan.
      </p>
      <div className="flex items-center justify-center gap-2 text-brand-blue-600 mb-4">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Upgrade to unlock</span>
      </div>
      <Link
        href="/host-shop/dashboard/subscription"
        className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
      >
        Upgrade Plan
      </Link>
    </div>
  );
}

interface UpgradePromptProps {
  feature: FeatureKey;
  planTier?: PlanTier;
  className?: string;
}

export function UpgradePrompt({ feature, planTier = 'starter', className = '' }: UpgradePromptProps) {
  const requiredPlan = planTier === 'starter' ? 'Professional' : 'Enterprise';

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">
            Upgrade to Unlock
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            This feature requires the {requiredPlan} plan.
          </p>
          <Link
            href="/host-shop/dashboard/subscription"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
