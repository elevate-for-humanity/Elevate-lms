import { NextResponse } from 'next/server';
import {
  FeatureUpgradeRequiredError,
  requireFeature,
} from '@/lib/platform/organization-features';
import { safeError } from '@/lib/api/safe-error';

/**
 * API route helper — call after resolving tenant/organization id.
 */
export async function apiRequireOrganizationFeature(
  organizationId: string,
  feature: string,
): Promise<{ ok: true } | NextResponse> {
  try {
    await requireFeature(organizationId, feature);
    return { ok: true };
  } catch (err) {
    if (err instanceof FeatureUpgradeRequiredError) {
      return safeError(err.message, 403);
    }
    throw err;
  }
}
