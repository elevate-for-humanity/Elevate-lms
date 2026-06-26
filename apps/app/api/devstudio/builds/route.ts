import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_deployments')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) return safeError('Failed to fetch Dev Studio builds', 500);
  return NextResponse.json({ builds: data });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const db = await requireAdminClient();
  const service = body.service ?? 'admin';

  const { data, error } = await db
    .from('ai_deployments')
    .insert({
      service,
      environment: body.environment ?? 'production',
      status: 'building',
      commit_sha: body.commit_sha ?? null,
      triggered_by: auth.id,
    })
    .select()
    .single();

  if (error) return safeError('Failed to create Dev Studio build record', 500);

  await db.from('dev_audit_logs').insert({
    user_id: auth.id,
    action: 'build_triggered',
    resource_type: 'ai_deployment',
    resource_id: data.id,
    metadata: { service },
  });

  const projectId = getNorthflankProjectId();
  const services = service === 'all'
    ? getNorthflankServices()
    : getNorthflankServices().filter((item) => item.key === service || item.id === service);

  if (!services.length) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return safeError(`Unknown Northflank service: ${service}`, 400);
  }

  if (!projectId || !isNorthflankReady()) {
    return NextResponse.json(
      {
        build: data,
        triggered: false,
        message: 'Build record created, but Northflank API credentials are not configured.',
      },
      { status: 202 },
    );
  }

  try {
    const northflankBuilds = await Promise.all(
      services.map(async (item) => ({
        service: item.id,
        build: await triggerNorthflankBuild(projectId, item.id),
      })),
    );
    await db.from('ai_deployments').update({ status: 'deploying' }).eq('id', data.id);
    return NextResponse.json(
      { build: { ...data, status: 'deploying' }, triggered: true, northflankBuilds },
      { status: 201 },
    );
  } catch (err) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return safeInternalError(err, 'Northflank build trigger failed');
  }
}
