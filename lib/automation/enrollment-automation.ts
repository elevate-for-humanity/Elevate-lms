import { logger } from '@/lib/logger';

/**
 * Advanced Enrollment Automation
 * Automates enrollment workflows and notifications
 */

import { createAdminClient } from '@/lib/supabase/admin';

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
  const supabase = createAdminClient();

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      student_id,
      program_id,
      profiles (full_name, email),
      programs (name)
    `)
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return { success: false, error: 'Enrollment not found' };

  const profile = enrollment.profiles as any;
  const program = enrollment.programs as any;

  // Day 0: Welcome email (already sent by webhook)

  // Day 1: Getting started guide
  setTimeout(async () => {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.email,
        subject: `Getting Started with ${program.name}`,
        html: `
          <h2>Getting Started Guide</h2>
          <p>Hi ${profile.full_name?.split(' ')[0]},</p>
          <p>Here's everything you need to know to get started...</p>
        `,
      }),
    });
  }, 24 * 60 * 60 * 1000); // 1 day

  // Day 3: Check-in email
  setTimeout(async () => {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.email,
        subject: 'How are you doing?',
        html: `
          <h2>Quick Check-In</h2>
          <p>Hi ${profile.full_name?.split(' ')[0]},</p>
          <p>Just checking in to see how your first few days are going...</p>
        `,
      }),
    });
  }, 3 * 24 * 60 * 60 * 1000); // 3 days

  return { success: true };
}

/**
 * Send reminder to inactive students
 */
export async function sendInactivityReminders() {
  const supabase = createAdminClient();

  // Find students who haven't been active in 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inactiveStudents } = await supabase
    .from('lms_progress')
    .select(`
      user_id,
      course_id,
      last_activity_at,
      progress_percent,
      profiles (full_name, email),
      courses (title)
    `)
    .lt('last_activity_at', sevenDaysAgo)
    .eq('status', 'in_progress');

  if (!inactiveStudents || inactiveStudents.length === 0) {
    return { sent: 0, message: 'No inactive students found' };
  }

  let sent = 0;

  for (const student of inactiveStudents) {
    const profile = student.profiles as any;
    const course = student.courses as any;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.email,
          subject: `We miss you in ${course.title}!`,
          html: `
            <h2>Come Back and Continue Learning!</h2>
            <p>Hi ${profile.full_name?.split(' ')[0]},</p>
            <p>We noticed you haven't been active in <strong>${course.title}</strong> for a while.</p>
            <p>You're ${student.progress_percent}% complete - keep going!</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/lms/courses/${student.course_id}">Continue Learning →</a></p>
          `,
        }),
      });
      sent++;
    } catch (error) { /* Error handled silently */ 
      logger.error(`Failed to send reminder to ${profile.email}:`, error);
    }
  }

  return { sent, total: inactiveStudents.length };
}

/**
 * Send completion nudge to students near completion
 */
export async function sendCompletionNudges() {
  const supabase = createAdminClient();

  // Find students who are 80%+ complete but haven't finished
  const { data: nearCompletion } = await supabase
    .from('lms_progress')
    .select(`
      user_id,
      course_id,
      progress_percent,
      profiles (full_name, email),
      courses (title)
    `)
    .gte('progress_percent', 80)
    .lt('progress_percent', 100)
    .eq('status', 'in_progress');

  if (!nearCompletion || nearCompletion.length === 0) {
    return { sent: 0, message: 'No students near completion' };
  }

  let sent = 0;

  for (const student of nearCompletion) {
    const profile = student.profiles as any;
    const course = student.courses as any;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.email,
          subject: `You're almost done with ${course.title}! 🎉`,
          html: `
            <h2>You're So Close!</h2>
            <p>Hi ${profile.full_name?.split(' ')[0]},</p>
            <p>You're ${student.progress_percent}% complete with <strong>${course.title}</strong>!</p>
            <p>Just a little more to go and you'll earn your certificate. Keep pushing!</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/lms/courses/${student.course_id}">Finish Strong →</a></p>
          `,
        }),
      });
      sent++;
    } catch (error) { /* Error handled silently */ 
      logger.error(`Failed to send nudge to ${profile.email}:`, error);
    }
  }

  return { sent, total: nearCompletion.length };
}

/**
 * Auto-assign courses based on program enrollment
 */
export async function autoAssignCourses(enrollmentId: string) {
  const supabase = createAdminClient();

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('student_id, program_id')
    .eq('id', enrollmentId)
    .single();

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
  const progressRecords = programCourses.map(pc => ({
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

  const results = await Promise.allSettled([
    sendInactivityReminders(),
    sendCompletionNudges(),
  ]);

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
