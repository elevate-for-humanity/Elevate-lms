import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// app/api/student/partner-enrollments/route.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const supabase = await getAdminClient();

  if (!user) {
    return NextResponse.json({ enrollments: [] }, { status: 200 });
  }

  const { data, error }: any = await supabase
    .from('partner_lms_enrollments')
    .select(
      `
      id,
      status,
      progress_percentage,
      enrolled_at,
      completed_at,
      metadata,
      partner_lms_providers ( provider_name ),
      partner_courses ( course_name )
    `
    )
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    logger.error('[GET /api/student/partner-enrollments] error', error);
    return NextResponse.json({ enrollments: [] }, { status: 200 });
  }

  const enrollments = (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    status: row.status,
    progress_percentage: row.progress_percentage,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at,
    course_name: row.partner_courses?.course_name ?? null,
    provider_name: row.partner_lms_providers?.provider_name ?? null,
  }));

  return NextResponse.json({ enrollments });
}
export const GET = withApiAudit('/api/student/partner-enrollments', _GET);
