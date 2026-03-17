import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getRuntimeReadiness } from '@/lib/tax-software/config/runtime-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Per-query timeout — prevents one slow table from hanging the whole bundle
const QUERY_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function safeQuery(
  db: any,
  table: string,
  select = '*',
  options?: { limit?: number; order?: string }
) {
  try {
    let query = db.from(table).select(select, { count: 'exact' });
    if (options?.order) query = query.order(options.order, { ascending: false });
    if (options?.limit) query = query.limit(options.limit);
    const { data, error, count } = await withTimeout(query, QUERY_TIMEOUT_MS);
    return { data: data || [], count: count || 0, error: error ? 'Query failed' : null };
  } catch (e) {
    return { data: [], count: 0, error: `"${table}" unavailable` };
  }
}

async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createAdminClient() ?? supabase;

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run all queries in parallel with individual timeouts
    const [
      courses,
      lessons,
      enrollments,
      profiles,
      lessonProgress,
      courseProgress,
      certificates,
      credentials,
      partnerEnrollments,
      partnerProviders,
      rapidsTracking,
      fundingCases,
      rapidsSubmissions,
    ] = await Promise.all([
      safeQuery(db, 'training_courses', 'id, course_name, course_code, is_active, duration_hours'),
      safeQuery(db, 'training_lessons', 'id, title, video_url, course_id', { limit: 1000 }),
      safeQuery(db, 'enrollments', 'id, user_id, course_id, status, enrolled_at', { limit: 200, order: 'enrolled_at' }),
      safeQuery(db, 'profiles', 'id, role, created_at', { limit: 1 }),
      safeQuery(db, 'lesson_progress', 'id, user_id, lesson_id, completed', { limit: 200 }),
      safeQuery(db, 'course_progress', 'id', { limit: 1 }),
      safeQuery(db, 'certificates', 'id, user_id, course_id, issued_at', { limit: 100 }),
      safeQuery(db, 'credentials', 'id, name, type', { limit: 50 }),
      safeQuery(db, 'partner_lms_enrollments', 'id, provider_id, status', { limit: 100 }),
      safeQuery(db, 'partner_lms_providers', 'id, provider_type, active'),
      safeQuery(db, 'rapids_tracking', 'id'),
      safeQuery(db, 'funding_cases', 'id, status'),
      safeQuery(db, 'rapids_submissions', 'id'),
    ]);

    // Video coverage
    const lessonsWithMp4 = lessons.data.filter((l: any) => l.video_url?.includes('.mp4')).length;
    const lessonsWithMp3 = lessons.data.filter((l: any) => l.video_url?.includes('.mp3') && !l.video_url?.includes('.mp4')).length;
    const lessonsNoMedia = lessons.count - lessonsWithMp4 - lessonsWithMp3;

    // Enrollment breakdown by status
    const enrollmentsByStatus: Record<string, number> = {};
    for (const e of enrollments.data) {
      const s = (e as any).status || 'unknown';
      enrollmentsByStatus[s] = (enrollmentsByStatus[s] || 0) + 1;
    }

    const enrolledCourseIds = new Set(enrollments.data.map((e: any) => e.course_id));

    // Surface any query errors in the bundle for transparency
    const queryErrors: Record<string, string | null> = {
      training_courses: courses.error,
      training_lessons: lessons.error,
      enrollments: enrollments.error,
      profiles: profiles.error,
      lesson_progress: lessonProgress.error,
      course_progress: courseProgress.error,
      certificates: certificates.error,
      credentials: credentials.error,
      partner_lms_enrollments: partnerEnrollments.error,
      partner_lms_providers: partnerProviders.error,
      rapids_tracking: rapidsTracking.error,
      funding_cases: fundingCases.error,
      rapids_submissions: rapidsSubmissions.error,
    };
    const activeErrors = Object.fromEntries(
      Object.entries(queryErrors).filter(([, v]) => v !== null)
    );

    // MeF readiness — non-blocking, errors surfaced in bundle
    let mefReadiness: ReturnType<typeof getRuntimeReadiness> | null = null;
    try {
      mefReadiness = getRuntimeReadiness();
    } catch {
      // getRuntimeReadiness is synchronous and should never throw, but guard anyway
    }

    const bundle = {
      generated_at: new Date().toISOString(),
      summary: {
        total_courses: courses.count,
        active_courses: courses.data.filter((c: any) => c.is_active).length,
        total_lessons: lessons.count,
        lessons_with_mp4: lessonsWithMp4,
        lessons_with_mp3_only: lessonsWithMp3,
        lessons_no_media: lessonsNoMedia,
        video_coverage_pct: lessons.count > 0 ? Math.round((lessonsWithMp4 / lessons.count) * 100) : 0,
        total_profiles: profiles.count,
        total_enrollments: enrollments.count,
        courses_with_enrollments: enrolledCourseIds.size,
        enrollments_by_status: enrollmentsByStatus,
        lesson_completions: lessonProgress.count,
        course_completions: courseProgress.count,
        certificates_issued: certificates.count,
        credentials_defined: credentials.count,
        partner_providers: partnerProviders.count,
        partner_enrollments: partnerEnrollments.count,
        rapids_tracking: rapidsTracking.count,
        rapids_submissions: rapidsSubmissions.count,
        funding_cases: fundingCases.count,
      },
      courses: courses.data,
      credentials: credentials.data,
      partner_providers: partnerProviders.data,
      recent_enrollments: enrollments.data.slice(0, 20),
      mef_readiness: mefReadiness ?? { ok: false, issues: [{ code: 'UNAVAILABLE', message: 'Could not check MeF readiness' }] },
      ...(Object.keys(activeErrors).length > 0 && { errors: activeErrors }),
    };

    return NextResponse.json(bundle);
  } catch (error) {
    logger.error('Support bundle generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate support bundle' },
      { status: 500 }
    );
  }
}

export const GET = withApiAudit('/api/monitoring/bundle', _GET);
