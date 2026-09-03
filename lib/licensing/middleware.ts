import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { checkLicenseAccess, type BillingAuthority } from './billing-authority';

/**
 * License validation for API routes.
 *
 * Platform/workspace billing is canonical in `managed_licenses`. The legacy
 * `licenses` table represents white-label/deployment licenses and is retained
 * only as a compatibility fallback for organizations that have not migrated.
 *
 * Uses billing authority rules:
 * - DB-Authoritative tiers: Access via expires_at
 * - Stripe-Authoritative tiers: Access via current_period_end
 */
export async function validateLicenseForAPI(
  request: NextRequest,
  options: {
    requireActive?: boolean;
    checkLimit?: 'students' | 'admins' | 'programs';
  } = {},
): Promise<{
  valid: boolean;
  error?: NextResponse;
  organizationId?: string;
  license?: any;
  billingAuthority?: BillingAuthority;
}> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      valid: false,
      error: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      valid: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    // Direct learners without an organization do not consume organization
    // platform licensing and are governed by enrollment/course entitlements.
    return { valid: true, organizationId: undefined };
  }

  // License state is operational billing data. Resolve the organization from
  // the authenticated user's RLS-scoped profile first, then read billing state
  // server-side so ordinary organization members do not need SELECT access to
  // the managed license table itself.
  const billingDb = await requireAdminClient();
  const { data: managedLicense, error: managedLicenseError } = await billingDb
    .from('managed_licenses')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .maybeSingle();

  if (managedLicenseError) {
    return {
      valid: false,
      error: NextResponse.json({ error: 'Unable to verify organization license' }, { status: 503 }),
    };
  }

  let license = managedLicense;
  let licenseSource: 'managed_licenses' | 'licenses' = 'managed_licenses';

  // Backward compatibility only for legacy white-label/deployment customers.
  if (!license) {
    const { data: legacyLicense, error: legacyLicenseError } = await billingDb
      .from('licenses')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .maybeSingle();
    if (legacyLicenseError) {
      return {
        valid: false,
        error: NextResponse.json({ error: 'Unable to verify organization license' }, { status: 503 }),
      };
    }
    license = legacyLicense;
    licenseSource = 'licenses';
  }

  if (!license) {
    return {
      valid: false,
      error: NextResponse.json({ error: 'No active license', code: 'NO_LICENSE' }, { status: 403 }),
    };
  }

  if (options.requireActive) {
    const accessResult = checkLicenseAccess({
      id: license.id,
      tier: license.tier || license.plan_id || 'unknown',
      status: license.status,
      expires_at: license.expires_at || license.trial_ends_at,
      current_period_end: license.current_period_end,
      stripe_subscription_id: license.stripe_subscription_id,
      stripe_customer_id: license.stripe_customer_id,
      canceled_at: license.canceled_at,
      suspended_at: license.suspended_at,
    });

    if (!accessResult.hasAccess) {
      let code = 'LICENSE_INACTIVE';
      if (accessResult.reason.includes('expired') || license.status === 'expired') {
        code = license.tier === 'trial' ? 'TRIAL_EXPIRED' : 'LICENSE_EXPIRED';
      } else if (accessResult.reason.includes('subscription')) {
        code = 'SUBSCRIPTION_REQUIRED';
      }

      return {
        valid: false,
        error: NextResponse.json(
          {
            error: accessResult.reason,
            code,
            billingAuthority: accessResult.authority,
          },
          { status: 403 },
        ),
        billingAuthority: accessResult.authority,
      };
    }
  }

  if (options.checkLimit) {
    const { data: usage } = await billingDb
      .from('license_usage')
      .select('*')
      .eq('license_id', license.id)
      .maybeSingle();

    if (usage) {
      const countKey = `${options.checkLimit.slice(0, -1)}_count`;
      const limitKey = `${options.checkLimit.slice(0, -1)}_limit`;

      const current = usage[countKey] || 0;
      const limit = usage[limitKey] || -1;

      if (limit !== -1 && current >= limit) {
        return {
          valid: false,
          error: NextResponse.json(
            {
              error: `${options.checkLimit} limit reached`,
              code: 'LIMIT_REACHED',
              current,
              limit,
            },
            { status: 403 },
          ),
        };
      }
    }
  }

  return {
    valid: true,
    organizationId: profile.organization_id,
    license: { ...license, source: licenseSource },
  };
}

/** Higher-order function to wrap API handlers with license validation. */
export function withLicenseValidation(
  handler: (
    request: NextRequest,
    context: { organizationId?: string; license?: any },
  ) => Promise<NextResponse>,
  options: {
    requireActive?: boolean;
    checkLimit?: 'students' | 'admins' | 'programs';
  } = {},
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateLicenseForAPI(request, options);

    if (!validation.valid && validation.error) {
      return validation.error;
    }

    return handler(request, {
      organizationId: validation.organizationId,
      license: validation.license,
    });
  };
}

/** Check if a feature is available for the current license plan. */
export function isPlanFeatureAvailable(planId: string, feature: string): boolean {
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
      'priority_support',
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
      'priority_support',
      'ai_features',
      'white_label',
      'sso',
      'dedicated_support',
      'custom_integrations',
      'unlimited_storage',
    ],
    'clone-starter': ['full_codebase', 'single_deployment', 'email_support', 'updates_1year'],
    'clone-pro': [
      'full_codebase',
      'multi_deployment',
      'priority_support',
      'lifetime_updates',
      'dev_studio',
    ],
    'clone-enterprise': [
      'full_codebase',
      'unlimited_deployment',
      'dedicated_support',
      'lifetime_updates',
      'dev_studio',
      'white_label',
      'custom_features',
      'source_code_escrow',
    ],
  };

  const features = planFeatures[planId] || planFeatures['starter'];
  return features.includes(feature);
}
