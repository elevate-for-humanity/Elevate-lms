/**
 * /api/admin/education/workflow
 *
 * Backs the Education E2E Workflow tool (/education-workflow). Adapter
 * over the platform's real curriculum tables — programs, courses,
 * course_modules, course_lessons, competencies, assessments — plus
 * program_enrollments and lesson_progress for the student-lifecycle
 * actions. Response shape matches the page: { success, data }.
 *
 * GET  (no params)                       -> { programs, competencies, assessments }
 * GET  ?program_id=..&include=..         -> { modules, courses, lessons, assessments }
 * POST { action: 'enroll_student',        data: { program_id, user_id } }
 * POST { action: 'update_lesson_progress', data: { lesson_id, user_id, status } }
 * POST { action: 'get_enrollment_progress' | 'get_student_transcript',
 *        data: { program_id, user_id } }
 * POST { action: 'export_approval_packet', data: { program_id } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Db = Awaited<ReturnType<typeof requireAdminClient>>;

async function guard() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: safeError('Unauthorized', 401) };
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: safeError('Forbidden', 403) };
  }
  return { db, user };
}

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

function mapProgram(p: Record<string, unknown>) {
  return {
    id: p.id,
    name: (p.title as string) ?? (p.name as string) ?? '',
    description: (p.description as string) ?? '',
    slug: (p.slug as string) ?? '',
    status: (p.status as string) ?? (p.is_active ? 'active' : 'inactive'),
  };
}

function mapAssessment(a: Record<string, unknown>) {
  return {
    id: a.id,
    name: (a.name as string) ?? '',
    assessment_type: 'assessment',
    passing_score: 0,
    competency_ids: [] as string[],
  };
}

async function programStructure(db: Db, programId: string) {
  const { data: courses } = await db
    .from('courses')
    .select('id, program_id, title, description, slug, status')
    .eq('program_id', programId)
    .order('created_at', { ascending: true });
  const courseRows = courses ?? [];
  const courseIds = courseRows.map((c) => c.id as string);

  let modules: Array<Record<string, unknown>> = [];
  let lessons: Array<Record<string, unknown>> = [];
  let assessments: Array<Record<string, unknown>> = [];
  if (courseIds.length) {
    const [mods, less, assess] = await Promise.all([
      db
        .from('course_modules')
        .select('id, course_id, title, description, order_index')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true }),
      db
        .from('course_lessons')
        .select('id, course_id, title, order_index, duration_minutes, lesson_type')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true }),
      db.from('assessments').select('id, name, course_id').in('course_id', courseIds),
    ]);
    const programByCourse = new Map(courseRows.map((c) => [c.id as string, programId]));
    modules = (mods.data ?? []).map((m) => ({
      id: m.id,
      program_id: programByCourse.get(m.course_id as string) ?? programId,
      title: m.title ?? '',
      description: m.description ?? '',
      order_index: m.order_index ?? 0,
    }));
    lessons = (less.data ?? []).map((l) => ({
      id: l.id,
      course_id: l.course_id,
      title: l.title ?? '',
      order_index: l.order_index ?? 0,
      duration_minutes: l.duration_minutes ?? 0,
      lesson_type: l.lesson_type ?? 'lesson',
      competency_keys: [] as string[],
    }));
    assessments = (assess.data ?? []).map(mapAssessment);
  }
  return {
    courses: courseRows.map((c) => ({
      id: c.id,
      program_id: c.program_id,
      title: c.title ?? '',
      description: c.description ?? '',
      slug: c.slug ?? '',
      status: c.status ?? 'active',
    })),
    modules,
    lessons,
    assessments,
  };
}

export async function GET(request: NextRequest) {
  const g = await guard();
  if ('error' in g) return g.error;
  const db = g.db;
  const programId = request.nextUrl.searchParams.get('program_id');

  if (programId) {
    const s = await programStructure(db, programId);
    return ok(s);
  }

  const [programs, competencies, assessments] = await Promise.all([
    db
      .from('programs')
      .select('id, title, name, description, slug, status, is_active')
      .order('title', { ascending: true })
      .limit(200),
    db.from('competencies').select('id, competency_key, domain_key, name').limit(500),
    db.from('assessments').select('id, name, course_id').limit(200),
  ]);
  return ok({
    programs: (programs.data ?? []).map(mapProgram),
    competencies: (competencies.data ?? []).map((c) => ({
      id: c.id,
      code: c.competency_key ?? c.domain_key ?? '',
      name: c.name ?? '',
      level: '',
    })),
    assessments: (assessments.data ?? []).map(mapAssessment),
  });
}

export async function POST(request: NextRequest) {
  const g = await guard();
  if ('error' in g) return g.error;
  const db = g.db;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    data?: Record<string, string>;
  };
  const action = body.action ?? '';
  const data = body.data ?? {};

  switch (action) {
    case 'enroll_student': {
      if (!data.program_id || !data.user_id) return fail('program_id and user_id are required');
      const { data: existing } = await db
        .from('program_enrollments')
        .select('id')
        .eq('program_id', data.program_id)
        .eq('user_id', data.user_id)
        .maybeSingle();
      if (existing) return ok({ enrollment: existing, already_enrolled: true });
      const { data: profile } = await db
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user_id)
        .maybeSingle();
      const { data: enrollment, error } = await db
        .from('program_enrollments')
        .insert({
          program_id: data.program_id,
          user_id: data.user_id,
          status: 'active',
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        })
        .select('id, user_id, program_id, status')
        .single();
      if (error) {
        // Never return the raw database message to the client (it can
        // contain internal details); log it server-side and return a
        // generic message. The integrity LEAKS audit blocks on
        // error.message in a response body.
        logger.error('education workflow: enroll student failed', error);
        return fail('Failed to enroll student', 500);
      }
      return ok({ enrollment });
    }
    case 'update_lesson_progress': {
      if (!data.lesson_id || !data.user_id) return fail('lesson_id and user_id are required');
      const completed = data.status === 'completed';
      const { data: lesson } = await db
        .from('course_lessons')
        .select('id, course_id')
        .eq('id', data.lesson_id)
        .maybeSingle();
      if (!lesson) return fail('Lesson not found', 404);
      const { data: course } = await db
        .from('courses')
        .select('program_id')
        .eq('id', lesson.course_id)
        .maybeSingle();
      const { data: existing } = await db
        .from('lesson_progress')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('lesson_id', data.lesson_id)
        .maybeSingle();
      const patch = {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        progress_percent: completed ? 100 : 0,
      };
      if (existing) {
        const { error } = await db.from('lesson_progress').update(patch).eq('id', existing.id);
        if (error) {
          logger.error('education workflow: update lesson progress failed', error);
          return fail('Failed to update lesson progress', 500);
        }
      } else {
        const { error } = await db.from('lesson_progress').insert({
          user_id: data.user_id,
          lesson_id: data.lesson_id,
          course_id: lesson.course_id,
          program_id: course?.program_id ?? null,
          ...patch,
        });
        if (error) {
          logger.error('education workflow: record lesson progress failed', error);
          return fail('Failed to update lesson progress', 500);
        }
      }
      return ok({ updated: true });
    }
    case 'get_enrollment_progress':
    case 'get_student_transcript': {
      if (!data.program_id || !data.user_id) return fail('program_id and user_id are required');
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('*')
        .eq('program_id', data.program_id)
        .eq('user_id', data.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!enrollment) return fail('Enrollment not found', 404);
      const s = await programStructure(db, data.program_id);
      const lessonIds = s.lessons.map((l) => l.id as string);
      let progress: Array<Record<string, unknown>> = [];
      if (lessonIds.length) {
        const { data: rows } = await db
          .from('lesson_progress')
          .select('id, lesson_id, completed, completed_at, progress_percent')
          .eq('user_id', data.user_id)
          .in('lesson_id', lessonIds);
        progress = rows ?? [];
      }
      const completedCount = progress.filter((p) => p.completed).length;
      const totalLessons = lessonIds.length;
      return ok({
        enrollment,
        progress,
        completedCount,
        totalLessons,
        percentage: totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0,
      });
    }
    case 'export_approval_packet': {
      if (!data.program_id) return fail('program_id is required');
      const { data: program } = await db
        .from('programs')
        .select('*')
        .eq('id', data.program_id)
        .maybeSingle();
      if (!program) return fail('Program not found', 404);
      const s = await programStructure(db, data.program_id);
      const { data: competencies } = await db
        .from('competencies')
        .select('id, competency_key, name')
        .eq('program_id', data.program_id);
      return ok({
        generated_at: new Date().toISOString(),
        program: mapProgram(program as Record<string, unknown>),
        ...s,
        competencies: competencies ?? [],
      });
    }
    default:
      return fail(`Unknown action: ${action}`);
  }
}
