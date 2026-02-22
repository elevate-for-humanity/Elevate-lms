
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/student/partner-enrollments/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
