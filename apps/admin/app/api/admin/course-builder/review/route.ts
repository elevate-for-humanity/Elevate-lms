import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'revert_to_draft';

const BodySchema = z.object({
  courseId: z.string().uuid(),
  action: z.enum(['submit', 'approve', 'reject', 'archive', 'revert_to_draft']),
  notes: z.string().max(10000).optional(),
});

const TRANSITIONS: Record<ReviewAction, { from: string[]; to: string }> = {
  submit: { from: ['draft', 'rejected'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  reject: { from: ['in_review'], to: 'rejected' },
  archive: { from: ['draft', 'in_review', 'approved', 'published', 'rejected'], to: 'archived' },
  revert_to_draft: { from: ['rejected', 'in_review'], to: 'draft' },
};

async function collectReadinessBlockers(db: Awaited<ReturnType<typeof requireAdminClient>>, courseId: string) {
  const [{ data: course, error: courseError }, { data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
    db.from('courses').select('duration_hours,program_id,compliance_profile_key,governing_body,governing_region').eq('id', courseId).maybeSingle(),
    db.from('course_modules').select('id,target_hours').eq('course_id', courseId),
    db.from('course_lessons').select('id,lesson_type,duration_minutes,minimum_seat_time_minutes,passing_score,learning_objectives,content,content_json').eq('course_id', courseId),
  ]);
  if (courseError) throw courseError;
  if (moduleError) throw moduleError;
  if (lessonError) throw lessonError;
  if (!course) return ['Course not found.'];

  const blockers: string[] = [];
  const rows = lessons ?? [];
  if (!(modules ?? []).length) blockers.push('Course has no modules.');
  if (!rows.length) blockers.push('Course has no lessons.');
  if (rows.some((lesson) => !String(lesson.content ?? '').trim() && !lesson.content_json)) {
    blockers.push('One or more lessons have no instructional content.');
  }
  if (rows.some((lesson) => !Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0)) {
    blockers.push('One or more lessons are missing learning objectives.');
  }
  const assessments = rows.filter((lesson) => ['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type ?? ''));
  if (assessments.some((lesson) => lesson.passing_score == null)) {
    blockers.push('One or more assessments are missing passing scores.');
  }
  const declaredHours = Number(course.duration_hours ?? 0);
  const seatHours = rows.reduce((sum, lesson) => sum + Number(lesson.minimum_seat_time_minutes ?? lesson.duration_minutes ?? 0), 0) / 60;
  let apprenticeshipProgram = false;
  if (course.program_id) {
    const { data: program, error: programError } = await db
      .from('programs')
      .select('is_apprenticeship,total_hours')
      .eq('id', course.program_id)
      .maybeSingle();
    if (programError) throw programError;
    apprenticeshipProgram = Boolean(program?.is_apprenticeship);
    if (apprenticeshipProgram && Number(program?.total_hours ?? 0) !== declaredHours) {
      blockers.push(`Course hours (${declaredHours}) do not match the linked apprenticeship program (${Number(program?.total_hours ?? 0)}).`);
    }
  }
  if (!apprenticeshipProgram && declaredHours > 0 && Math.abs(declaredHours - seatHours) > Math.max(1, declaredHours * 0.05)) {
    blockers.push(`Declared hours (${declaredHours}) do not reconcile with configured lesson seat hours (${seatHours.toFixed(2)}).`);
  }
  if (course.compliance_profile_key === 'dol_apprenticeship' && !(course.governing_body && course.governing_region)) {
    blockers.push('DOL apprenticeship courses require governing body and governing region metadata.');
  }
  return blockers;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid review request', 400);
  const { courseId, action, notes } = parsed.data;

  try {
    const db = await requireAdminClient();
    const { data: course, error: loadError } = await db
      .from('courses')
      .select('id,title,review_status')
      .eq('id', courseId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!course) return safeError('Course not found', 404);

    const currentStatus = course.review_status ?? 'draft';
    const transition = TRANSITIONS[action];
    if (!transition.from.includes(currentStatus)) {
      return safeError(
        `Cannot '${action}' a course in '${currentStatus}' state. Allowed from: ${transition.from.join(', ')}`,
        409,
      );
    }

    if (action === 'submit' || action === 'approve') {
      const blockers = await collectReadinessBlockers(db, courseId);
      if (blockers.length) {
        return NextResponse.json(
          { ok: false, error: 'Course readiness blockers must be resolved before review can advance.', blockers },
          { status: 409 },
        );
      }
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      review_status: transition.to,
      updated_at: now,
    };
    if (action === 'submit') {
      update.submitted_for_review_at = now;
      update.submitted_by = auth.id;
    }
    if (action === 'approve' || action === 'reject') {
      update.reviewed_at = now;
      update.reviewed_by = auth.id;
      update.review_notes = notes ?? null;
    }
    if (action === 'revert_to_draft') {
      update.reviewed_at = null;
      update.reviewed_by = null;
    }

    const { error: updateError } = await db.from('courses').update(update).eq('id', courseId);
    if (updateError) throw updateError;

    const { error: logError } = await db.from('program_review_log').insert({
      course_id: courseId,
      program_id: null,
      action: action === 'revert_to_draft' ? 'reverted_to_draft' : action,
      from_status: currentStatus,
      to_status: transition.to,
      actor_id: auth.id,
      notes: notes ?? null,
      created_at: now,
    });
    if (logError) throw logError;

    return NextResponse.json({ ok: true, courseId, review_status: transition.to });
  } catch (error) {
    return safeInternalError(error, 'Failed to update course review state');
  }
}
