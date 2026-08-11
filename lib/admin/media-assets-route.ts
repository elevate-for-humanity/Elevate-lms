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

const mediaTypeSchema = z.enum([
  'video',
  'audio',
  'image',
  'document',
  'other',
]);

const listQuerySchema = z.object({
  org_id: z.string().uuid().optional(),
  type: mediaTypeSchema.optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const createSchema = z.object({
  org_id: z.string().uuid().optional(),
  storage_path: z
    .string()
    .trim()
    .min(1)
    .max(2_000)
    .refine(
      (value) => !value.includes('..'),
      'Storage path cannot contain parent-directory traversal.',
    ),
  type: mediaTypeSchema,
  mime_type: z.string().trim().max(255).optional(),
  duration_seconds: z.number().int().positive().max(86_400).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  transcript: z.string().max(500_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

type CreatedMediaAsset = {
  id: string;
  org_id: string;
  storage_path: string;
  type: z.infer<typeof mediaTypeSchema>;
  mime_type: string | null;
  duration_seconds: number | null;
  title: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function getQueryInput(request: NextRequest) {
  const url = new URL(request.url);
  return {
    org_id: url.searchParams.get('org_id') ?? undefined,
    type: url.searchParams.get('type') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    offset: url.searchParams.get('offset') ?? undefined,
  };
}

export async function listMediaAssets(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsedQuery = listQuerySchema.safeParse(getQueryInput(request));
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid media query.',
          details: parsedQuery.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth, parsedQuery.data.org_id);
  } catch (error) {
    return safeError(
      error instanceof Error ? error.message : 'Unable to resolve organization.',
      403,
    );
  }

  try {
    const db = await requireAdminClient();
    let query = db
      .from('media_assets')
      .select(
        [
          'id',
          'org_id',
          'storage_path',
          'type',
          'mime_type',
          'duration_seconds',
          'title',
          'status',
          'metadata',
          'created_by',
          'created_at',
          'updated_at',
        ].join(', '),
        { count: 'exact' },
      )
      .eq('org_id', actor.organizationId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(
        parsedQuery.data.offset,
        parsedQuery.data.offset + parsedQuery.data.limit - 1,
      );

    if (parsedQuery.data.type) {
      query = query.eq('type', parsedQuery.data.type);
    }

    if (parsedQuery.data.search) {
      const escaped = parsedQuery.data.search
        .replaceAll('%', '\\%')
        .replaceAll('_', '\\_');
      query = query.ilike('title', `%${escaped}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      await writePlatformAuditFailure(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: 'media.list',
          resourceType: 'media_asset',
          metadata: {
            type: parsedQuery.data.type,
            limit: parsedQuery.data.limit,
            offset: parsedQuery.data.offset,
          },
        },
        error,
      );
      return safeInternalError(error, 'Failed to list media assets');
    }

    await writePlatformAuditEvent({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'media.list',
      resourceType: 'media_asset',
      status: 'succeeded',
      metadata: {
        resultCount: data?.length ?? 0,
        totalCount: count ?? 0,
        type: parsedQuery.data.type,
      },
    });

    return NextResponse.json({
      ok: true,
      assets: data ?? [],
      pagination: {
        total: count ?? 0,
        limit: parsedQuery.data.limit,
        offset: parsedQuery.data.offset,
      },
    });
  } catch (error) {
    await writePlatformAuditFailure(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'media.list',
        resourceType: 'media_asset',
      },
      error,
    );
    return safeInternalError(error, 'Failed to list media assets');
  }
}

export async function createMediaAsset(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return safeError('Request body must be valid JSON.', 400);
  }

  const parsedBody = createSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid media asset.',
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

  const { org_id: _ignoredRequestedOrganization, ...assetInput } = parsedBody.data;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('media_assets')
      .insert({
        ...assetInput,
        org_id: actor.organizationId,
        created_by: actor.userId,
        status: 'active',
      })
      .select(
        [
          'id',
          'org_id',
          'storage_path',
          'type',
          'mime_type',
          'duration_seconds',
          'title',
          'status',
          'metadata',
          'created_at',
        ].join(', '),
      )
      .single();

    if (error) {
      await writePlatformAuditFailure(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: 'media.create',
          resourceType: 'media_asset',
          metadata: {
            storagePath: assetInput.storage_path,
            type: assetInput.type,
          },
        },
        error,
      );

      if (error.code === '23505') {
        return safeError('This storage path is already registered.', 409);
      }
      return safeInternalError(error, 'Failed to create media asset');
    }

    const created = data as unknown as CreatedMediaAsset;

    await writePlatformAuditEvent({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'media.create',
      resourceType: 'media_asset',
      resourceId: created.id,
      status: 'succeeded',
      metadata: {
        type: created.type,
        storagePath: created.storage_path,
      },
    });

    return NextResponse.json({ ok: true, asset: created }, { status: 201 });
  } catch (error) {
    await writePlatformAuditFailure(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'media.create',
        resourceType: 'media_asset',
        metadata: {
          storagePath: assetInput.storage_path,
          type: assetInput.type,
        },
      },
      error,
    );
    return safeInternalError(error, 'Failed to create media asset');
  }
}
