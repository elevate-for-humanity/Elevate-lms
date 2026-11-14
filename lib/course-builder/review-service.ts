import { z } from 'zod';
import { requireAdminClient } from '../supabase/admin';
import { logAdminAudit, AdminAction } from '../admin/audit-log';

const reviewActionSchema = z.enum(['submit', 'approve', 'reject', 'archive', 'revert_to_draft']);
const courseReviewSchema = z.object({
  courseId: z.string().uuid(),
  action: reviewActionSchema,
  notes: z.string().max(5000).optional(),
});
const lessonReviewSchema = z.object({
  courseId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  lessonIds: z.array(z.string().uuid()).min(1).optional(),
  allRequired: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
}).refine((value) => value.allRequired === true || Boolean(value.lessonIds?.length), {
  message: 'lessonIds or allRequired=true is required',
});

type ReviewAction = z.infer<typeof reviewActionSchema>;
const TRANSITIONS: Record<ReviewAction, { from: string[]; to: string }> = {
  submit: { from: ['draft', 'rejected'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  reject: { from: ['in_review'], to: 'rejected' },
  archive: { from: ['draft', 'in_review', 'approved', 'published', 'rejected'], to: 'archived' },
  revert_to_draft: { from: ['rejected', 'in_review'], to: 'draft' },
};

export async function reviewCanonicalCourse(input: unknown, actorId: string) {
  const body = courseReviewSchema.parse(input);
  const db = await requireAdminClient();
  const { data: course, error: loadError } = await db
    .from('courses')
    .select('id,title,review_status')
    .eq('id', body.courseId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!course) throw new Error('Course not found');

  const currentStatus = course.review_status ?? 'draft';
  const transition = TRANSITIONS[body.action];
  if (!transition.from.includes(currentStatus)) {
    throw new Error(`Cannot '${body.action}' a course in '${currentStatus}' state. Allowed from: ${transition.from.join(', ')}`);
  }

  if (body.action === 'approve') {
    const [{ count: total, error: totalError }, { count: approved, error: approvedError }] = await Promise.all([
      db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', body.courseId).eq('is_required', true),
      db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', body.courseId).eq('is_required', true).eq('approved', true),
    ]);
    if (totalError) throw totalError;
    if (approvedError) throw approvedError;
    if ((total ?? 0) === 0) throw new Error('Course has no required lessons to approve');
    if ((approved ?? 0) !== (total ?? 0)) {
      throw new Error(`Course approval blocked: required lesson approval incomplete (${approved ?? 0}/${total ?? 0})`);
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { review_status: transition.to, updated_at: now };
  if (body.action === 'submit') {
    update.submitted_for_review_at = now;
    update.submitted_by = actorId;
  }
  if (body.action === 'approve' || body.action === 'reject') {
    update.reviewed_at = now;
    update.reviewed_by = actorId;
    update.review_notes = body.notes ?? null;
  }
  if (body.action === 'revert_to_draft') {
    update.reviewed_at = null;
    update.reviewed_by = null;
    update.review_notes = body.notes ?? null;
  }

  const { error: updateError } = await db.from('courses').update(update).eq('id', body.courseId);
  if (updateError) throw updateError;

  await db.from('program_review_log').insert({
    course_id: body.courseId,
    action: body.action === 'revert_to_draft' ? 'reverted_to_draft' : body.action,
    from_status: currentStatus,
    to_status: transition.to,
    actor_id: actorId,
    notes: body.notes ?? null,
    created_at: now,
  });

  await logAdminAudit({
    action: AdminAction.COURSE_DEFINITIONS_SYNCED,
    actorId,
    entityType: 'courses',
    entityId: body.courseId,
    metadata: { operation: 'course_review', action: body.action, from_status: currentStatus, to_status: transition.to },
  });

  return { courseId: body.courseId, review_status: transition.to };
}

export async function reviewCanonicalLessons(input: unknown, actorId: string) {
  const body = lessonReviewSchema.parse(input);
  const db = await requireAdminClient();

  let query = db.from('course_lessons').select('id,approved,is_required').eq('course_id', body.courseId);
  if (body.allRequired === true) query = query.eq('is_required', true);
  else query = query.in('id', body.lessonIds ?? []);

  const { data: lessons, error: loadError } = await query;
  if (loadError) throw loadError;
  if (!lessons?.length) throw new Error('No matching course lessons found');
  if (body.lessonIds?.length && lessons.length !== new Set(body.lessonIds).size) {
    throw new Error('One or more lessonIds do not belong to the course');
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const approved = body.action === 'approve';
  const { error: updateError } = await db
    .from('course_lessons')
    .update({ approved, updated_at: new Date().toISOString() })
    .in('id', lessonIds);
  if (updateError) throw updateError;

  // Rejecting a lesson invalidates any course-level approval immediately.
  if (!approved) {
    await db.from('courses').update({
      review_status: 'draft',
      submitted_for_review_at: null,
      submitted_by: null,
      reviewed_at: null,
      reviewed_by: null,
      review_notes: body.notes ?? 'Lesson review rejected',
      updated_at: new Date().toISOString(),
    }).eq('id', body.courseId);
  }

  await logAdminAudit({
    action: AdminAction.LESSON_UPDATED,
    actorId,
    entityType: 'course_lessons',
    entityId: body.courseId,
    metadata: {
      operation: 'lesson_review',
      action: body.action,
      lesson_ids: lessonIds,
      lesson_count: lessonIds.length,
      all_required: body.allRequired === true,
      notes: body.notes ?? null,
    },
  });

  return { courseId: body.courseId, action: body.action, lessonIds, count: lessonIds.length };
}
