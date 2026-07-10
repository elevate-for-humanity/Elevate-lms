import 'server-only';
import { logger } from '@/lib/logger';

/**
 * Advanced Enrollment Automation
 * Automates enrollment workflows and notifications
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';

export interface EnrollmentAutomation {
  id: string;
  type: 'welcome' | 'reminder' | 'follow-up' | 'completion-nudge';
  triggerDays: number; // Days after enrollment
  enabled: boolean;
}

/**
 * Send welcome sequence after enrollment
 */
export async function sendWelcomeSequence(enrollmentId: string) {
  const supabase = await requireAdminClient();
  await setAuditContext(supabase, { systemActor: 'enrollment_automation' });

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      student_id,
      program_id,
      profiles (full_name, email),
      programs (name)
    `,
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  if (!enrollment) return { success: false, error: 'Enrollment not found' };

  const profile = enrollment.profiles as any;
  const program = enrollment.programs as any;

  const firstName: string = profile.full_name?.split(' ')[0] ?? 'there';
  const email: string = profile.email;
  const programName: string = program.name;

  if (!email) return { success: false, error: 'No email on profile' };

  // Day 0: Welcome email already sent by enrollment webhook — skip here.

  // Day 1: Getting-started guide — enqueue with run_after = now + 24 h
  const day1RunAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: day1Error } = await supabase.from('job_queue').insert({
    type: 'welcome_email',
    payload: {
      enrollmentId,
      userId: enrollment.student_id,
      email,
      firstName,
      programName,
      step: 'day1',
    },
    run_after: day1RunAfter,
  });

  if (day1Error) {
    logger.error('[sendWelcomeSequence] Failed to enqueue day1 email', day1Error);
  }

  // Day 3: Check-in — enqueue with run_after = now + 72 h
  const day3RunAfter = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const { error: day3Error } = await supabase.from('job_queue').insert({
    type: 'welcome_email',
    payload: {
      enrollmentId,
      userId: enrollment.student_id,
      email,
      firstName,
      programName,
      step: 'day3',
    },
    run_after: day3RunAfter,
  });

  if (day3Error) {
    logger.error('[sendWelcomeSequence] Failed to enqueue day3 email', day3Error);
  }

  return { success: true };
}

/**
 * Send reminder to inactive students
 */
export async function sendInactivityReminders() {
  const supabase = await requireAdminClient();
  await setAuditContext(supabase, { systemActor: 'enrollment_automation' });

  // Use the at_risk_learners view — canonical source for inactive learners.
  // Covers learners with no learning_activities entry in 14+ days.
  const { data: inactiveStudents } = await supabase
    .from('at_risk_learners')
    .select('user_id, enrollment_id, full_name, email, program_name, inactive_days')
    .lte('inactive_days', 30) // cap at 30 days — beyond that, stale-applications cron handles it
    .order('inactive_days', { ascending: false })
    .limit(100);

  if (!inactiveStudents || inactiveStudents.length === 0) {
    return { sent: 0, message: 'No inactive students found' };
  }

  let sent = 0;

  for (const student of inactiveStudents) {
    if (!student.email) continue;
    const firstName = student.full_name?.split(' ')[0] ?? 'there';

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.CRON_SECRET ?? '',
        },
        body: JSON.stringify({
          to: student.email,
          subject: `We miss you in ${student.program_name}!`,
          html: `
            <h2>Come Back and Continue Learning!</h2>
            <p>Hi ${firstName},</p>
            <p>We noticed you haven't been active in <strong>${student.program_name}</strong> for ${student.inactive_days} days.</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/lms">Continue Learning →</a></p>
          `,
        }),
      });
      sent++;
    } catch (error) {
      logger.error(`Failed to send inactivity reminder to ${student.email}:`, error);
    }
  }

  return { sent, total: inactiveStudents.length };
}

/**
 * Send completion nudge to students near completion
 */
export async function sendCompletionNudges() {
  const supabase = await requireAdminClient();
  await setAuditContext(supabase, { systemActor: 'enrollment_automation' });

  // Find enrollments that are active but not yet completed, joined to profile.
  // lesson_progress is the canonical progress table — compute completion % from it.
  const { data: nearCompletion } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      student_id,
      program_id,
      profiles!inner (full_name, email),
      programs!inner (name)
    `)
    .eq('status', 'active')
    .limit(200);

  if (!nearCompletion || nearCompletion.length === 0) {
    return { sent: 0, message: 'No students near completion' };
  }

  let sent = 0;

  for (const enrollment of nearCompletion) {
    const profile = enrollment.profiles as any;
    const program = enrollment.programs as any;
    if (!profile?.email) continue;

    // Count total lessons and completed lessons for this enrollment's program.
    const { count: totalLessons } = await supabase
      .from('curriculum_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', enrollment.program_id)
      .in('step_type', ['lesson', 'lab', 'assignment']);

    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', enrollment.student_id)
      .eq('completed', true);

    if (!totalLessons || !completedLessons) continue;
    const pct = Math.round((completedLessons / totalLessons) * 100);
    if (pct < 80 || pct >= 100) continue;

    const firstName = profile.full_name?.split(' ')[0] ?? 'there';

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.CRON_SECRET ?? '',
        },
        body: JSON.stringify({
          to: profile.email,
          subject: `You're almost done with ${program.name}!`,
          html: `
            <h2>You're So Close!</h2>
            <p>Hi ${firstName},</p>
            <p>You're ${pct}% complete with <strong>${program.name}</strong>.</p>
            <p>Just a little more to go and you'll earn your certificate.</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/lms">Finish Strong →</a></p>
          `,
        }),
      });
      sent++;
    } catch (error) {
      logger.error(`Failed to send completion nudge to ${profile.email}:`, error);
    }
  }

  return { sent, total: nearCompletion.length };
}

/**
 * Auto-assign courses based on program enrollment
 */
export async function autoAssignCourses(enrollmentId: string) {
  const supabase = await requireAdminClient();
  await setAuditContext(supabase, { systemActor: 'enrollment_automation' });

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('student_id, program_id')
    .eq('id', enrollmentId)
    .maybeSingle();

  if (!enrollment) return { success: false, error: 'Enrollment not found' };

  // Get courses for this program
  const { data: programCourses } = await supabase
    .from('program_courses')
    .select('course_id')
    .eq('program_id', enrollment.program_id);

  if (!programCourses || programCourses.length === 0) {
    return { success: true, assigned: 0, message: 'No courses to assign' };
  }

  // Create progress records for each course
  const progressRecords = programCourses.map((pc) => ({
    user_id: enrollment.student_id,
    course_id: pc.course_id,
    status: 'not_started',
    progress_percent: 0,
  }));

  const { error } = await supabase
    .from('lms_progress')
    .upsert(progressRecords, { onConflict: 'user_id,course_id' });

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  return { success: true, assigned: programCourses.length };
}

/**
 * Schedule automated emails
 */
export async function scheduleAutomatedEmails(enrollmentId: string) {
  // This would integrate with a job queue system like BullMQ or Inngest
  // For now, we'll use setTimeout as a simple example

  const automations: EnrollmentAutomation[] = [
    { id: '1', type: 'welcome', triggerDays: 0, enabled: true },
    { id: '2', type: 'reminder', triggerDays: 1, enabled: true },
    { id: '3', type: 'follow-up', triggerDays: 3, enabled: true },
    { id: '4', type: 'completion-nudge', triggerDays: 7, enabled: true },
  ];

  return { scheduled: automations.length, automations };
}

/**
 * Run all automation tasks (called by cron job)
 */
export async function runAutomationTasks() {
  const results = await Promise.allSettled([sendInactivityReminders(), sendCompletionNudges()]);

  const summary = {
    timestamp: new Date().toISOString(),
    tasks: results.map((r, i) => ({
      task: i === 0 ? 'inactivity-reminders' : 'completion-nudges',
      status: r.status,
      result: r.status === 'fulfilled' ? r.value : { error: (r.reason as Error).message },
    })),
  };

  return summary;
}
