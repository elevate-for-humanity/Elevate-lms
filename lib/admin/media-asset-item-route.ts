import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { resolveAdminOrganization } from '@/lib/admin/resolve-admin-organization';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  writePlatformAuditEvent,
  writePlatformAuditFailure,
} from '@/lib/audit/platform-audit';
import { requireAdminClient } from '@/lib/supabase/admin';

const routeParamsSchema = z.object({ id: z.string().uuid() });
const updateSchema = z
  .object({
    org_id: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(300).optional(),
    transcript: z.string().max(500_000).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(['active', 'archived']).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.transcript !== undefined ||
      value.metadata !== undefined ||
      value.status !== undefined,
    'At least one editable field is required.',
  );

export type MediaAssetRouteContext = {
  params: Promise<{ id: string }>;
};

export async function updateMediaAsset(
  request: NextRequest,
  context: MediaAssetRouteContext,
) {
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsedParams = routeParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) return safeError('Invalid media asset ID.', 400);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return safeError('Request body must be valid JSON.', 400);
  }

  const parsedBody = updateSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid media asset update.',
          details: parsedBody.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth, parsedBody.data.org_id);
  } catch (error) {
    return safeError(
      error instanceof Error ? error.message : 'Unable to resolve organization.',
      403,
    );
  }

  const { org_id: _requestedOrganization, ...updates } = parsedBody.data;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('media_assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', parsedParams.data.id)
      .eq('org_id', actor.organizationId)
      .is('deleted_at', null)
      .select('id, org_id, storage_path, type, title, status, metadata, updated_at')
      .maybeSingle();

    if (error) {
      await writePlatformAuditFailure(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: 'media.update',
          resourceType: 'media_asset',
          resourceId: parsedParams.data.id,
        },
        error,
      );
      return safeInternalError(error, 'Failed to update media asset');
    }

    if (!data) return safeError('Media asset not found.', 404);

    await writePlatformAuditEvent({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'media.update',
      resourceType: 'media_asset',
      resourceId: data.id,
      metadata: { changedFields: Object.keys(updates) },
    });

    return NextResponse.json({ ok: true, asset: data });
  } catch (error) {
    await writePlatformAuditFailure(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'media.update',
        resourceType: 'media_asset',
        resourceId: parsedParams.data.id,
      },
      error,
    );
    return safeInternalError(error, 'Failed to update media asset');
  }
}

export async function deleteMediaAsset(
  request: NextRequest,
  context: MediaAssetRouteContext,
) {
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsedParams = routeParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) return safeError('Invalid media asset ID.', 400);

  const organizationId = new URL(request.url).searchParams.get('org_id');

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth, organizationId);
  } catch (error) {
    return safeError(
      error instanceof Error ? error.message : 'Unable to resolve organization.',
      403,
    );
  }

  try {
    const db = await requireAdminClient();
    const deletedAt = new Date().toISOString();
    const { data, error } = await db
      .from('media_assets')
      .update({ status: 'archived', deleted_at: deletedAt, updated_at: deletedAt })
      .eq('id', parsedParams.data.id)
      .eq('org_id', actor.organizationId)
      .is('deleted_at', null)
      .select('id, org_id, storage_path')
      .maybeSingle();

    if (error) {
      await writePlatformAuditFailure(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: 'media.delete',
          resourceType: 'media_asset',
          resourceId: parsedParams.data.id,
        },
        error,
      );
      return safeInternalError(error, 'Failed to delete media asset');
    }

    if (!data) return safeError('Media asset not found.', 404);

    await writePlatformAuditEvent({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'media.delete',
      resourceType: 'media_asset',
      resourceId: data.id,
      metadata: { storagePath: data.storage_path, deletionType: 'soft-delete' },
    });

    return NextResponse.json({ ok: true, deleted: true, id: data.id });
  } catch (error) {
    await writePlatformAuditFailure(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'media.delete',
        resourceType: 'media_asset',
        resourceId: parsedParams.data.id,
      },
      error,
    );
    return safeInternalError(error, 'Failed to delete media asset');
  }
}
