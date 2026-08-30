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
  const db = await requireAdminClient();
  const { data, error } = await db.from('course_factory_jobs').select('id,job_id,credential_slug,credential_name,stage,progress,message,quality_score,error,status,queued_at,started_at,completed_at,metadata').order('queued_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ jobs: [], total: 0, status: 'unavailable' }, { status: 503 });
  return NextResponse.json({ jobs: data ?? [], total: data?.length ?? 0, status: 'healthy' }, { headers: { 'Cache-Control': 'no-store' } });
}
