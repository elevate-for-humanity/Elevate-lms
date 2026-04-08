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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = createAdminClient() ?? supabase;

    // Run all queries in parallel with individual timeouts
    const [
      // Canonical LMS tables
      programs,
      courseModules,
      courseLessons,
      curriculumLessons,
      programEnrollments,
      lessonProgress,
      checkpointScores,
      stepSubmissions,
      completionCertificates,
      examAuthorizations,
      // Supporting tables
      profiles,
      credentials,
      partnerEnrollments,
      partnerProviders,
      rapidsTracking,
      fundingCases,
      rapidsSubmissions,
    ] = await Promise.all([
      safeQuery(db, 'programs', 'id, title, slug, published, is_active, status'),
      safeQuery(db, 'course_modules', 'id, title, program_id'),
      safeQuery(db, 'course_lessons', 'id, title, lesson_type, course_id', { limit: 2000 }),
      safeQuery(db, 'curriculum_lessons', 'id, title, step_type, status, video_url', { limit: 2000 }),
      safeQuery(db, 'program_enrollments', 'id, user_id, program_id, status, enrolled_at', { limit: 200, order: 'enrolled_at' }),
      safeQuery(db, 'lesson_progress', 'id, user_id, lesson_id, completed', { limit: 200 }),
      safeQuery(db, 'checkpoint_scores', 'id, user_id, passed'),
      safeQuery(db, 'step_submissions', 'id, user_id, status'),
      safeQuery(db, 'program_completion_certificates', 'id, user_id, program_id, issued_at', { limit: 100 }),
      safeQuery(db, 'exam_funding_authorizations', 'id, user_id, status'),
      safeQuery(db, 'profiles', 'id, role, created_at', { limit: 1 }),
      safeQuery(db, 'credentials', 'id, name, type', { limit: 50 }),
      safeQuery(db, 'partner_lms_enrollments', 'id, provider_id, status', { limit: 100 }),
      safeQuery(db, 'partner_lms_providers', 'id, provider_type, active'),
      safeQuery(db, 'rapids_tracking', 'id'),
      safeQuery(db, 'funding_cases', 'id, status'),
      safeQuery(db, 'rapids_submissions', 'id'),
    ]);

    // Program breakdown
    const publishedPrograms = programs.data.filter(
      (p: any) => p.published && p.is_active && p.status !== 'archived'
    ).length;

    // Lesson media coverage (curriculum_lessons is canonical)
    const lessonsWithMp4 = curriculumLessons.data.filter((l: any) => l.video_url?.includes('.mp4')).length;
    const lessonsWithMp3 = curriculumLessons.data.filter(
      (l: any) => l.video_url?.includes('.mp3') && !l.video_url?.includes('.mp4')
    ).length;
    const lessonsNoMedia = curriculumLessons.count - lessonsWithMp4 - lessonsWithMp3;

    // Lesson type breakdown from course_lessons
    const lessonsByType: Record<string, number> = {};
    for (const l of courseLessons.data) {
      const t = (l as any).lesson_type || 'unknown';
      lessonsByType[t] = (lessonsByType[t] || 0) + 1;
    }

    // Enrollment breakdown by status
    const enrollmentsByStatus: Record<string, number> = {};
    for (const e of programEnrollments.data) {
      const s = (e as any).status || 'unknown';
      enrollmentsByStatus[s] = (enrollmentsByStatus[s] || 0) + 1;
    }

    const enrolledProgramIds = new Set(programEnrollments.data.map((e: any) => e.program_id));

    // Checkpoint pass rate
    const checkpointsPassed = checkpointScores.data.filter((c: any) => c.passed).length;
    const checkpointPassRate = checkpointScores.count > 0
      ? Math.round((checkpointsPassed / checkpointScores.count) * 100)
      : null;

    // Surface any query errors in the bundle for transparency
    const queryErrors: Record<string, string | null> = {
      programs: programs.error,
      course_modules: courseModules.error,
      course_lessons: courseLessons.error,
      curriculum_lessons: curriculumLessons.error,
      program_enrollments: programEnrollments.error,
      lesson_progress: lessonProgress.error,
      checkpoint_scores: checkpointScores.error,
      step_submissions: stepSubmissions.error,
      program_completion_certificates: completionCertificates.error,
      exam_funding_authorizations: examAuthorizations.error,
      profiles: profiles.error,
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
        // Programs
        total_programs: programs.count,
        published_programs: publishedPrograms,
        total_modules: courseModules.count,
        // Lessons
        total_course_lessons: courseLessons.count,
        total_curriculum_lessons: curriculumLessons.count,
        lessons_by_type: lessonsByType,
        lessons_with_mp4: lessonsWithMp4,
        lessons_with_mp3_only: lessonsWithMp3,
        lessons_no_media: lessonsNoMedia,
        video_coverage_pct: curriculumLessons.count > 0
          ? Math.round((lessonsWithMp4 / curriculumLessons.count) * 100)
          : 0,
        // Enrollments & progress
        total_profiles: profiles.count,
        total_enrollments: programEnrollments.count,
        programs_with_enrollments: enrolledProgramIds.size,
        enrollments_by_status: enrollmentsByStatus,
        lesson_completions: lessonProgress.count,
        checkpoint_attempts: checkpointScores.count,
        checkpoint_pass_rate_pct: checkpointPassRate,
        step_submissions: stepSubmissions.count,
        // Completions
        certificates_issued: completionCertificates.count,
        exam_authorizations: examAuthorizations.count,
        // Credentials & partners
        credentials_defined: credentials.count,
        partner_providers: partnerProviders.count,
        partner_enrollments: partnerEnrollments.count,
        // RAPIDS / funding
        rapids_tracking: rapidsTracking.count,
        rapids_submissions: rapidsSubmissions.count,
        funding_cases: fundingCases.count,
      },
      programs: programs.data,
      credentials: credentials.data,
      partner_providers: partnerProviders.data,
      recent_enrollments: programEnrollments.data.slice(0, 20),
      mef_readiness: mefReadiness ?? {
        ok: false,
        issues: [{ code: 'UNAVAILABLE', message: 'Could not check MeF readiness' }],
      },
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
