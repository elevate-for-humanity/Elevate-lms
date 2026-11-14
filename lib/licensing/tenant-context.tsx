'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Organization {
  id: string;
  name: string;
  type: string;
  domain: string | null;
  contact_name: string;
  contact_email: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    favicon_url?: string;
  };
}

export interface License {
  id: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended';
  plan_id: string;
  trial_ends_at: string | null;
  current_period_end: string;
}

export interface LicenseUsage {
  student_count: number;
  student_limit: number;
  admin_count: number;
  admin_limit: number;
  program_count: number;
  program_limit: number;
}

interface TenantContextType {
  organization: Organization | null;
  license: License | null;
  usage: LicenseUsage | null;
  isLoading: boolean;
  error: string | null;

  // Computed properties
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  isPastDue: boolean;
  isLicenseValid: boolean;

  // Limit checks
  canAddStudent: boolean;
  canAddAdmin: boolean;
  canAddProgram: boolean;

  // Feature checks
  hasFeature: (feature: string) => boolean;

  // Actions
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [usage, setUsage] = useState<LicenseUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenantData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) {
        setIsLoading(false);
        return;
      }

      // Get organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .maybeSingle();

      if (org) {
        setOrganization(org);
      }

      // Get license
      const { data: lic } = await supabase
        .from('licenses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (lic) {
        setLicense(lic);

        // Get usage
        const { data: usg } = await supabase
          .from('license_usage')
          .select('*')
          .eq('license_id', lic.id)
          .maybeSingle();

        if (usg) {
          setUsage(usg);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  // Computed properties
  const isTrialActive = license?.status === 'trial';

  const trialDaysRemaining = (() => {
    if (!license?.trial_ends_at) return null;
    const trialEnd = new Date(license.trial_ends_at);
    const now = new Date();
    const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  })();

  const isPastDue = license?.status === 'past_due';

  const isLicenseValid = license ? ['active', 'trial'].includes(license.status) : false;

  // Limit checks
  const canAddStudent =
    !usage || usage.student_limit === -1 || usage.student_count < usage.student_limit;
  const canAddAdmin = !usage || usage.admin_limit === -1 || usage.admin_count < usage.admin_limit;
  const canAddProgram =
    !usage || usage.program_limit === -1 || usage.program_count < usage.program_limit;

  // Feature check
  const hasFeature = (feature: string): boolean => {
    if (!license) return false;

    const planFeatures: Record<string, string[]> = {
      starter: ['basic_lms', 'student_portal', 'course_management', 'basic_reports'],
      pro: [
        'basic_lms',
        'student_portal',
        'course_management',
        'basic_reports',
        'advanced_reports',
        'api_access',
        'custom_branding',
        'ai_features',
      ],
      enterprise: [
        'basic_lms',
        'student_portal',
        'course_management',
        'basic_reports',
        'advanced_reports',
        'api_access',
        'custom_branding',
        'ai_features',
        'white_label',
        'sso',
        'unlimited_storage',
      ],
    };

    const features = planFeatures[license.plan_id] || planFeatures['starter'];
    return features.includes(feature);
  };

  const value: TenantContextType = {
    organization,
    license,
    usage,
    isLoading,
    error,
    isTrialActive,
    trialDaysRemaining,
    isPastDue,
    isLicenseValid,
    canAddStudent,
    canAddAdmin,
    canAddProgram,
    hasFeature,
    refreshTenant: loadTenantData,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * HOC to wrap components that require tenant context
 */
export function withTenant<P extends object>(
  Component: React.ComponentType<P & { tenant: TenantContextType }>,
) {
  return function WithTenantComponent(props: P) {
    const tenant = useTenant();
    return <Component {...props} tenant={tenant} />;
  };
}

/**
 * Component to show content only if license is valid
 */
export function RequireLicense({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLicenseValid, isLoading } = useTenant();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded" />;
  }

  if (!isLicenseValid) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Component to show content only if a feature is available
 */
export function RequireFeature({
  feature,
  children,
  fallback,
}: {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasFeature, isLoading } = useTenant();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded" />;
  }

  if (!hasFeature(feature)) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Component to show trial banner
 */
export function TrialBanner() {
  const { isTrialActive, trialDaysRemaining, isPastDue } = useTenant();

  if (isPastDue) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
        <strong>Payment overdue.</strong> Please update your payment method to continue using all
        features.
        <a href="/account/billing" className="ml-2 underline">
          Update Payment →
        </a>
      </div>
    );
  }

  if (isTrialActive && trialDaysRemaining !== null) {
    const urgency = trialDaysRemaining <= 3 ? 'bg-orange-500' : 'bg-blue-600';
    return (
      <div className={`${urgency} text-white px-4 py-2 text-center text-sm`}>
        <strong>{trialDaysRemaining} days left</strong> in your trial.
        <a href="/store/licenses" className="ml-2 underline">
          Upgrade now →
        </a>
      </div>
    );
  }

  return null;
}

/**
 * Component to show usage limits
 */
export function UsageLimits() {
  const { usage, isLoading } = useTenant();

  if (isLoading || !usage) return null;

  const formatLimit = (count: number, limit: number) => {
    if (limit === -1) return `${count} / Unlimited`;
    return `${count} / ${limit}`;
  };

  const getPercentage = (count: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(100, (count / limit) * 100);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Students</span>
          <span>{formatLimit(usage.student_count, usage.student_limit)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${getPercentage(usage.student_count, usage.student_limit)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Admins</span>
          <span>{formatLimit(usage.admin_count, usage.admin_limit)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all"
            style={{ width: `${getPercentage(usage.admin_count, usage.admin_limit)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Programs</span>
          <span>{formatLimit(usage.program_count, usage.program_limit)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all"
            style={{ width: `${getPercentage(usage.program_count, usage.program_limit)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
