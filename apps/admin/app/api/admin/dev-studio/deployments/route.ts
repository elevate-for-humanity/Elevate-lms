import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

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
