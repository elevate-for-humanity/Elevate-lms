/**
 * POST /api/internal/lesson-pace-check
 *
 * Daily cron: identify learners whose lesson completion pace is behind schedule.
 *
 * Pace formula:
 *   days_elapsed      = today - enrollment start date
 *   expected_lessons  = (total_lessons / program_duration_days) * days_elapsed
 *   completed_lessons = count of lesson_progress rows with status='completed'
 *   deficit           = expected_lessons - completed_lessons
 *
 * If deficit >= LESSON_DEFICIT_THRESHOLD, the learner is flagged:
 *   1. In-app notification (idempotent — one per day per learner)
 *   2. student_risk_status updated (status escalated if already watch/at_risk)
 *   3. Platform event emitted
 *
 * Gated by CRON_SECRET via withRuntime({ cron: true }).
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Flag learners who are this many lessons or more behind expected pace.
const LESSON_DEFICIT_THRESHOLD = 2;

// Default program duration when not set on the program row.
const DEFAULT_PROGRAM_DAYS = 180; // 6-month program

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // Load active enrollments with program info and lesson counts
  const { data: enrollments, error: enrollErr } = await db
    .from('lms_progress')
    .select(`
      id,
      user_id,
      course_id,
      status,
      progress_percent,
      last_activity_at,
      courses (
        id,
        title,
        program_id,
        programs (
          id,
          name,
          duration_weeks
        )
      )
    `)
    .in('status', ['enrolled', 'in_progress'])
    .limit(500);

  if (enrollErr) {
    logger.error('[lesson-pace-check] Failed to load lms_progress', enrollErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!enrollments?.length) {
    return NextResponse.json({ ok: true, flagged: 0 });
  }

  // Get lesson counts per course
  const courseIds = [...new Set(enrollments.map((e: any) => e.course_id).filter(Boolean))];
  const { data: lessonCounts } = courseIds.length
    ? await db
        .from('course_lessons')
        .select('course_id')
        .in('course_id', courseIds)
    : { data: [] };

  const lessonCountMap: Record<string, number> = {};
  for (const row of lessonCounts ?? []) {
    const cid = (row as any).course_id;
    lessonCountMap[cid] = (lessonCountMap[cid] ?? 0) + 1;
  }

  // Get completed lesson counts per user+course
  const userIds = [...new Set(enrollments.map((e: any) => e.user_id).filter(Boolean))];
  const { data: completedRows } = userIds.length && courseIds.length
    ? await db
        .from('lesson_progress')
        .select('user_id, course_id')
        .in('user_id', userIds)
        .in('course_id', courseIds)
        .eq('status', 'completed')
    : { data: [] };

  // Build completed count map: `${userId}:${courseId}` → count
  const completedMap: Record<string, number> = {};
  for (const row of completedRows ?? []) {
    const key = `${(row as any).user_id}:${(row as any).course_id}`;
    completedMap[key] = (completedMap[key] ?? 0) + 1;
  }

  // Get enrollment start dates from program_enrollments
  const { data: programEnrollments } = userIds.length
    ? await db
        .from('program_enrollments')
        .select('user_id, program_id, enrolled_at, created_at')
        .in('user_id', userIds)
        .eq('status', 'active')
    : { data: [] };

  // Map user_id → earliest enrollment date
  const enrollStartMap: Record<string, string> = {};
  for (const pe of programEnrollments ?? []) {
    const uid = (pe as any).user_id;
    const date = (pe as any).enrolled_at ?? (pe as any).created_at;
    if (!enrollStartMap[uid] || date < enrollStartMap[uid]) {
      enrollStartMap[uid] = date;
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let flagged = 0;

  for (const enrollment of enrollments as any[]) {
    const userId = enrollment.user_id;
    const courseId = enrollment.course_id;
    const course = enrollment.courses;
    const program = course?.programs;

    const totalLessons = lessonCountMap[courseId] ?? 0;
    if (totalLessons === 0) continue;

    const durationDays = program?.duration_weeks
      ? program.duration_weeks * 7
      : DEFAULT_PROGRAM_DAYS;

    const startDateStr = enrollStartMap[userId];
    if (!startDateStr) continue;

    const startDate = new Date(startDateStr);
    const daysElapsed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Don't flag in the first 3 days — grace period
    if (daysElapsed < 3) continue;

    const expectedLessons = (totalLessons / durationDays) * daysElapsed;
    const completedLessons = completedMap[`${userId}:${courseId}`] ?? 0;
    const deficit = expectedLessons - completedLessons;

    if (deficit < LESSON_DEFICIT_THRESHOLD) continue;

    // Idempotent in-app notification — one per learner per day
    await db
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'deadline_reminder',
        title: 'You may be falling behind on lessons',
        message: `You are approximately ${Math.round(deficit)} lesson${Math.round(deficit) !== 1 ? 's' : ''} behind your expected pace in ${course?.title ?? 'your course'}. Log in to catch up.`,
        action_label: 'Continue learning',
        action_url: `/lms/courses/${courseId}`,
        link: `/lms/courses/${courseId}`,
        read: false,
        idempotency_key: `lesson-pace-${userId}-${courseId}-${todayStr}`,
      })
      .onConflict('idempotency_key')
      .ignore()
      .catch(() => {});

    // Upsert student_risk_status — escalate status if already watch
    const { data: existingRisk } = await db
      .from('student_risk_status')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    const currentStatus = existingRisk?.status ?? 'on_track';
    const newStatus =
      currentStatus === 'on_track' ? 'watch' :
      currentStatus === 'watch' ? 'at_risk' :
      currentStatus; // don't downgrade at_risk/critical

    if (existingRisk?.id) {
      await Promise.resolve(
        db
          .from('student_risk_status')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRisk.id)
      ).catch(() => {});
    } else {
      await Promise.resolve(
        db
          .from('student_risk_status')
          .insert({
            user_id: userId,
            status: 'watch',
            days_since_activity: 0,
            overdue_count: Math.round(deficit),
            progress_percentage: enrollment.progress_percent ?? 0,
            last_activity_date: enrollment.last_activity_at
              ? new Date(enrollment.last_activity_at).toISOString().split('T')[0]
              : null,
          })
      ).catch(() => {});
    }

    // Platform event
    await emitEvent('student.lesson_pace_behind', 'lms', {
      severity: deficit >= 5 ? 'warning' : 'info',
      actor_type: 'cron',
      subject_id: userId,
      subject_type: 'student',
      payload: {
        course_id: courseId,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        expected_lessons: Math.round(expectedLessons),
        deficit: Math.round(deficit),
        days_elapsed: daysElapsed,
      },
      message: `Learner is ${Math.round(deficit)} lessons behind pace in ${course?.title ?? courseId}`,
    }).catch(() => {});

    flagged++;
  }

  logger.info('[lesson-pace-check] Run complete', { flagged, total: enrollments.length });
  return NextResponse.json({ ok: true, flagged, total: enrollments.length });
});
