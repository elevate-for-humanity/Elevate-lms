/**
 * POST /api/platform/workspaces/provision
 * Platform staff only — creates a customer workspace (tenant + org + async provision job).
 *
 * @see docs/platform-owner-tenant-model.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequirePlatformStaff } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { provisionWorkspace } from '@/lib/workspace/provision-workspace';
import type { WorkspaceSubscriptionTier } from '@/lib/workspace/tier-limits';

const VALID_TIERS: WorkspaceSubscriptionTier[] = ['builder', 'pro', 'agency'];

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequirePlatformStaff(request);
  if (auth.error) return auth.error;

  let body: {
    displayName?: string;
    slug?: string;
    subscriptionTier?: WorkspaceSubscriptionTier;
    templateSlug?: string;
    contactEmail?: string;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const displayName = body.displayName?.trim();
  const slug = body.slug?.trim();
  const subscriptionTier = body.subscriptionTier ?? 'builder';

  if (!displayName) return safeError('displayName is required', 400);
  if (!slug) return safeError('slug is required', 400);
  if (!VALID_TIERS.includes(subscriptionTier)) {
    return safeError('Invalid subscriptionTier', 400);
  }

  try {
    const result = await provisionWorkspace({
      displayName,
      slug,
      subscriptionTier,
      templateSlug: body.templateSlug,
      contactEmail: body.contactEmail,
      provisionedByUserId: auth.id,
    });

    if (!result.ok) {
      return safeError(result.error, 400);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to provision workspace');
  }
}
