import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectCourseGaps, createGapDraftJobs } from '@/lib/dev-studio/course-gap-detection';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('program_id') || undefined;
  const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | undefined;
  const includeResolved = searchParams.get('include_resolved') === 'true';

  try {
    const supabase = await createClient();
    const result = await detectCourseGaps(supabase, {
      programId,
      severity,
      includeResolved,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Course gap detection error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Detection failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    
    // First detect gaps
    const result = await detectCourseGaps(supabase);
    
    // Then create draft jobs
    const jobResult = await createGapDraftJobs(supabase, result.gaps);

    return NextResponse.json({
      gaps_found: result.gaps.length,
      jobs_created: jobResult.created,
      jobs_skipped: jobResult.skipped,
      summary: result.summary,
    });
  } catch (err) {
    console.error('Create gap jobs error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Job creation failed' },
      { status: 500 }
    );
  }
}