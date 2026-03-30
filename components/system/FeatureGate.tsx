'use client';

import { isFeatureEnabled } from '@/lib/features';

interface FeatureGateProps {
  id: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the named feature is enabled.
 * Optionally renders a fallback when disabled.
 */
export function FeatureGate({ id, children, fallback = null }: FeatureGateProps) {
  if (!isFeatureEnabled(id)) return <>{fallback}</>;
  return <>{children}</>;
}
