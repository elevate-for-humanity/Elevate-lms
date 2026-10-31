import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError } from '@/lib/api/safe-error';
import { apiRequireOrganizationFeature } from '@/lib/api/require-organization-feature';
import { FEATURES, type FeatureCode } from '@/lib/platform/feature-catalog';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import {
  hasActiveTrialLicense,
  resolveTenantIdForUser,
} from '@/lib/platform/resolve-tenant-for-user';
import { requireAdminClient } from '@/lib/supabase/admin';

const TRIAL_DEFAULT_FEATURES: FeatureCode[] = [
  FEATURES.WEBSITE,
  FEATURES.CRM,
  FEATURES.FORMS,
  FEATURES.BOOKINGS,
  FEATURES.AI_BASIC,
  FEATURES.LMS,
];

export async function requireFeatureForAuth(
  request: NextRequest,
  feature: FeatureCode,
): Promise<{ userId: string; tenantId: string } | NextResponse> {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const userId = auth.id;
  const tenantId = await resolveTenantIdForUser(userId);

  if (!tenantId) {
    return safeError('Organization subscription required', 403);
  }

  const entitlements = await getOrganizationFeatures(tenantId);
  if (entitlements.features.includes(feature)) {
    return { userId, tenantId };
  }

  // A recurring subscription is authoritative, including missing features and expired periods.
  // An older trial must never restore access after cancellation or downgrade.
  if (entitlements.status !== null) {
    return safeError('Feature is not available on the current subscription', 403);
  }

  const db = await requireAdminClient();
  const { data: org } = await db
    .from('organizations')
    .select('id')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (org?.id && (await hasActiveTrialLicense(org.id))) {
    if (TRIAL_DEFAULT_FEATURES.includes(feature)) {
      return { userId, tenantId };
    }
  }

  const featureAccess = await apiRequireOrganizationFeature(tenantId, feature);
  if (featureAccess instanceof NextResponse) {
    return featureAccess;
  }
  return { userId, tenantId };
}
