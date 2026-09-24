import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateNorthflankEnv } from '@/lib/secrets';
import { getNorthflankProjectId, isNorthflankReady } from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('ai_deployments')
      .select(
        'id,service,service_name,environment,status,commit_sha,git_sha,build_id,health_check,health_status,health_url,log_summary,started_at,completed_at,created_at,metadata',
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[dev-studio/deployments] query failed', error);
      return NextResponse.json(
        { deployments: [], total: 0, status: 'unavailable', warnings: ['Deployment history is temporarily unavailable.'] },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const deployments = (data ?? []).map((row) => ({
      ...row,
      service: row.service_name ?? row.service ?? 'unknown',
      commit_sha: row.git_sha ?? row.commit_sha ?? null,
      started_at: row.started_at ?? row.created_at,
    }));

    return NextResponse.json(
      { deployments, total: deployments.length, status: 'healthy', warnings: [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[dev-studio/deployments] initialization failed', error);
    return NextResponse.json(
      { deployments: [], total: 0, status: 'unavailable', warnings: ['Deployment storage is temporarily unavailable.'] },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}


export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const service = String(body.service || '');
  const allowed = new Set(['elevate-marketing', 'elevate-lms', 'elevate-admin']);
  if (!allowed.has(service)) {
    return NextResponse.json({ error: 'Invalid deployment target' }, { status: 400 });
  }

  await hydrateNorthflankEnv().catch(() => undefined);
  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return NextResponse.json({ error: 'Northflank control plane is unavailable' }, { status: 503 });
  }

  // Deployment execution stays in the existing canonical GitHub/Northflank
  // pipeline. Dev Studio records the requested target and the repository
  // workflow remains responsible for exact-SHA build, health verification,
  // rollout and rollback safety.
  const db = await requireAdminClient();
  const { data, error } = await db.from('ai_deployments').insert({
    service,
    service_name: service,
    environment: 'production',
    status: 'pending',
    started_at: new Date().toISOString(),
    metadata: { requested_from: 'dev-studio', project_id: projectId, branch: 'main' },
  }).select().single();
  if (error) return NextResponse.json({ error: 'Could not create deployment request' }, { status: 500 });

  return NextResponse.json({ ok: true, deployment: data, execution: 'canonical-github-northflank-pipeline' }, { status: 202 });
}
