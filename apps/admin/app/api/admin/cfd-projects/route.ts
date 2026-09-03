import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { resolveAdminOrganization } from '@/lib/admin/resolve-admin-organization';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { writePlatformAuditEvent, writePlatformAuditFailure } from '@/lib/audit/platform-audit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const boundaryConditionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['inlet', 'outlet', 'wall', 'symmetry']),
  values: z.record(z.string(), z.union([z.string().max(500), z.number().finite()])),
});

const configurationSchema = z.object({
  analysisType: z.enum(['steady-incompressible', 'transient-incompressible', 'heat-transfer']),
  fluid: z.object({
    name: z.string().trim().min(1).max(100),
    densityKgM3: z.number().finite().positive().max(100_000),
    dynamicViscosityPaS: z.number().finite().positive().max(10_000),
  }),
  boundaryConditions: z.array(boundaryConditionSchema).min(2).max(100),
  mesh: z.object({
    baseCellSize: z.number().finite().positive().max(10_000),
    refinementLevel: z.number().int().min(0).max(10),
  }),
});

const createProjectSchema = z.object({
  org_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  solver: z.literal('openfoam').default('openfoam'),
  configuration: configurationSchema,
  input_media_asset_ids: z.array(z.string().uuid()).max(20).default([]),
});

const listQuerySchema = z.object({
  org_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'validating', 'ready', 'queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function hasRequiredBoundaryTypes(conditions: z.infer<typeof boundaryConditionSchema>[]): boolean {
  const types = new Set(conditions.map((condition) => condition.type));
  return types.has('inlet') && types.has('outlet') && types.has('wall');
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const parsedQuery = listQuerySchema.safeParse({
    org_id: url.searchParams.get('org_id') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    offset: url.searchParams.get('offset') ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid CFD project query.', details: parsedQuery.error.flatten() },
    }, { status: 400 });
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth, parsedQuery.data.org_id);
  } catch {
    return safeError('Unable to resolve organization.', 403);
  }

  try {
    const db = await requireAdminClient();
    let query = db
      .from('cfd_projects')
      .select([
        'id', 'organization_id', 'name', 'description', 'solver', 'status', 'configuration',
        'input_media_asset_ids', 'output_media_asset_ids', 'container_job_id', 'failure_message',
        'created_by', 'created_at', 'updated_at', 'started_at', 'completed_at',
      ].join(', '), { count: 'exact' })
      .eq('organization_id', actor.organizationId)
      .order('created_at', { ascending: false })
      .range(parsedQuery.data.offset, parsedQuery.data.offset + parsedQuery.data.limit - 1);

    if (parsedQuery.data.status) query = query.eq('status', parsedQuery.data.status);

    const { data, error, count } = await query;
    if (error) return safeInternalError(error, 'Failed to list CFD projects');

    return NextResponse.json({
      ok: true,
      projects: data ?? [],
      pagination: { total: count ?? 0, limit: parsedQuery.data.limit, offset: parsedQuery.data.offset },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to list CFD projects');
  }
}

export async function POST(request: NextRequest) {
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

  const parsedBody = createProjectSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid CFD project.', details: parsedBody.error.flatten() },
    }, { status: 400 });
  }

  if (!hasRequiredBoundaryTypes(parsedBody.data.configuration.boundaryConditions)) {
    return safeError('CFD configuration requires at least one inlet, outlet and wall boundary.', 400);
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth, parsedBody.data.org_id);
  } catch {
    return safeError('Unable to resolve organization.', 403);
  }

  const { org_id: _requestedOrganization, ...projectInput } = parsedBody.data;

  try {
    const db = await requireAdminClient();

    if (projectInput.input_media_asset_ids.length > 0) {
      const { data: assets, error: assetsError } = await db
        .from('media_assets')
        .select('id')
        .eq('org_id', actor.organizationId)
        .is('deleted_at', null)
        .in('id', projectInput.input_media_asset_ids);

      if (assetsError) return safeInternalError(assetsError, 'Failed to validate CFD input assets');
      if ((assets?.length ?? 0) !== projectInput.input_media_asset_ids.length) {
        return safeError('One or more CFD input assets are unavailable.', 400);
      }
    }

    const { data, error } = await db
      .from('cfd_projects')
      .insert({
        organization_id: actor.organizationId,
        created_by: actor.userId,
        name: projectInput.name,
        description: projectInput.description ?? null,
        solver: projectInput.solver,
        status: 'ready',
        configuration: projectInput.configuration,
        input_media_asset_ids: projectInput.input_media_asset_ids,
      })
      .select('*')
      .single();

    if (error) {
      await writePlatformAuditFailure({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'cfd.project.create',
        resourceType: 'cfd_project',
      }, error);
      return safeInternalError(error, 'Failed to create CFD project');
    }

    await writePlatformAuditEvent({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'cfd.project.create',
      resourceType: 'cfd_project',
      resourceId: data.id,
      metadata: { solver: data.solver, analysisType: projectInput.configuration.analysisType },
    });

    return NextResponse.json({ ok: true, project: data }, { status: 201 });
  } catch (error) {
    await writePlatformAuditFailure({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'cfd.project.create',
      resourceType: 'cfd_project',
    }, error);
    return safeInternalError(error, 'Failed to create CFD project');
  }
}
