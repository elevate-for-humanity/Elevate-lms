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
  const [jobsResult, assetsResult, videosResult] = await Promise.all([
    db.from('media_jobs').select('id,lesson_id,program_id,job_type,status,output_path,error_message,created_at,started_at,completed_at').order('created_at', { ascending: false }).limit(100),
    db.from('course_media_assets').select('id,course_id,generated_course_id,title,media_type,url,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('course_videos').select('id,lesson_id,course_id,title,video_url,storage_path,duration_seconds,thumbnail_url,generated_by,status,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
  ]);
  const errors = [jobsResult.error, assetsResult.error, videosResult.error].filter(Boolean);
  return NextResponse.json({
    jobs: jobsResult.data ?? [],
    assets: assetsResult.data ?? [],
    videos: videosResult.data ?? [],
    status: errors.length ? 'degraded' : 'healthy',
    warnings: errors.length ? ['One or more media sources are temporarily unavailable.'] : [],
  }, { status: errors.length === 3 ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
}
