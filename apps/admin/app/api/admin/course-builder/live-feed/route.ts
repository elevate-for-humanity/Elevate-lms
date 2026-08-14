import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CourseRow = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  program_id: string | null;
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const limitRaw = Number(new URL(request.url).searchParams.get('limit') ?? '20');
    const limit = Number.isFinite(limitRaw) ? Math.max(5, Math.min(limitRaw, 100)) : 20;

    const { data: supabasePing, error: supabaseError } = await db
      .from('programs')
      .select('id')
      .limit(1);

    const { data: courses, error: courseError } = await db
      .from('courses')
      .select('id, title, slug, status, created_at, updated_at, program_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (courseError) {
      return NextResponse.json(
        {
          supabase: {
            ok: !supabaseError,
            message: supabaseError ? supabaseError.message : 'connected',
          },
          error: courseError.message,
        },
        { status: 500 },
      );
    }

    const courseRows = (courses ?? []) as CourseRow[];
    const ids = courseRows.map((c) => c.id);

    const [modulesRes, lessonsRes, jobsRes, legacyRes] = await Promise.all([
      ids.length
        ? db.from('course_modules').select('id, course_id').in('course_id', ids)
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? db.from('course_lessons').select('id, course_id, video_status').in('course_id', ids)
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? db.from('video_jobs').select('id, course_id, status').in('course_id', ids)
        : Promise.resolve({ data: [], error: null }),
      db.from('lms_courses').select('id, title, slug, status, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const moduleCount = new Map<string, number>();
    const lessonCount = new Map<string, number>();
    const videoPending = new Map<string, number>();
    const videoComplete = new Map<string, number>();
    const queueByCourse = new Map<string, number>();

    for (const row of modulesRes.data ?? []) {
      const key = row.course_id as string;
      moduleCount.set(key, (moduleCount.get(key) ?? 0) + 1);
    }

    for (const row of lessonsRes.data ?? []) {
      const key = row.course_id as string;
      lessonCount.set(key, (lessonCount.get(key) ?? 0) + 1);

      if (row.video_status === 'complete') {
        videoComplete.set(key, (videoComplete.get(key) ?? 0) + 1);
      }

      if (row.video_status === 'queued' || row.video_status === 'rendering') {
        videoPending.set(key, (videoPending.get(key) ?? 0) + 1);
      }
    }

    for (const row of jobsRes.data ?? []) {
      const key = row.course_id as string;
      if (row.status === 'queued' || row.status === 'running' || row.status === 'processing') {
        queueByCourse.set(key, (queueByCourse.get(key) ?? 0) + 1);
      }
    }

    const migrationTables = ['program_announcements', 'program_discussions', 'program_discussion_replies'];
    const migrationResults: Array<{ table: string; status: 'EXISTS' | 'REQUIRES_MANUAL' | 'ERROR' }> = [];

    for (const table of migrationTables) {
      try {
        const { error } = await db.from(table).select('id').limit(1);
        if ((error as { code?: string } | null)?.code === 'PGRST205') {
          migrationResults.push({ table, status: 'REQUIRES_MANUAL' });
        } else if (error) {
          migrationResults.push({ table, status: 'ERROR' });
        } else {
          migrationResults.push({ table, status: 'EXISTS' });
        }
      } catch {
        migrationResults.push({ table, status: 'ERROR' });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      supabase: {
        ok: !supabaseError,
        message: supabaseError ? supabaseError.message : `connected (${(supabasePing ?? []).length} ping row)`,
      },
      migrations: {
        ok: migrationResults.every((m) => m.status === 'EXISTS'),
        results: migrationResults,
      },
      courses: courseRows.map((course) => ({
        ...course,
        moduleCount: moduleCount.get(course.id) ?? 0,
        lessonCount: lessonCount.get(course.id) ?? 0,
        videoPending: videoPending.get(course.id) ?? 0,
        videoComplete: videoComplete.get(course.id) ?? 0,
        queuedJobs: queueByCourse.get(course.id) ?? 0,
      })),
      legacyCourses: legacyRes.data ?? [],
      errors: {
        modules: modulesRes.error?.message ?? null,
        lessons: lessonsRes.error?.message ?? null,
        jobs: jobsRes.error?.message ?? null,
        legacy: legacyRes.error?.message ?? null,
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load live generator feed');
  }
}