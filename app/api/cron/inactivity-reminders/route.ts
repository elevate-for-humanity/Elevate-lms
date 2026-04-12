import { getAdminClient } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';

import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job (e.g., scheduled cron, GitHub Actions, or external service)
// Recommended: Run daily at 9 AM

async function _GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role key for admin operations
    const supabase = await getAdminClient();

    // Find students who haven't logged in for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all active enrollments
    const { data: rawInactiveEnrollments } = await supabase
      .from('program_enrollments')
      .select(`id, user_id, courses!inner(id, title)`)
      .eq('status', 'active');

    if (!rawInactiveEnrollments || rawInactiveEnrollments.length === 0) {
      return NextResponse.json({ message: 'No active enrollments found' });
    }

    // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
    const inactiveUserIds = [...new Set(rawInactiveEnrollments.map((e: any) => e.user_id).filter(Boolean))];
    const { data: inactiveProfiles } = inactiveUserIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', inactiveUserIds)
      : { data: [] };
    const inactiveProfileMap = Object.fromEntries((inactiveProfiles ?? []).map((p: any) => [p.id, p]));
    const enrollments = rawInactiveEnrollments.map((e: any) => ({
      ...e,
      student_id: e.user_id,
      profiles: inactiveProfileMap[e.user_id] ?? null,
    }));

    const studentIds = enrollments.map((e: any) => e.student_id);

    // Get last login for each student
    const { data: lastLogins } = await supabase
      .from('attendance_log')
      .select('student_id, login_time')
      .in('student_id', studentIds)
      .order('login_time', { ascending: false });

    // Group by student_id to get most recent login
    const lastLoginMap = new Map();
    lastLogins?.forEach((log) => {
      if (!lastLoginMap.has(log.student_id)) {
        lastLoginMap.set(log.student_id, new Date(log.login_time));
      }
    });

    // Send reminders to inactive students
    const reminders = [];
    for (const enrollment of enrollments) {
      const lastLogin = lastLoginMap.get(enrollment.student_id);

      // Type guards: Extract nested relations
      const profile = Array.isArray(enrollment.profiles)
        ? enrollment.profiles[0]
        : enrollment.profiles;
      const course = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses;

      // If no login ever, or last login was 7+ days ago
      if (!lastLogin || lastLogin < sevenDaysAgo) {
        const daysSinceLogin = lastLogin
          ? Math.floor(
              (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 30; // Default to 30 if never logged in

        const studentName =
          profile?.full_name || profile?.email?.split('@')[0] || 'Student';
        const courseName = course?.title || 'Course';
        const studentEmail = profile?.email || '';
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/learner/dashboard`;

        const html = emailTemplates.inactivityReminder(
          studentName,
          courseName,
          daysSinceLogin,
          loginUrl
        );

        try {
          await sendEmail({
            to: studentEmail,
            subject: `We Miss You! Continue Your ${courseName} Journey`,
            html,
          });

          reminders.push({
            studentId: enrollment.student_id,
            email: studentEmail,
            daysSinceLogin,
          });
        } catch (error) { 
          logger.error(`Failed to send reminder to ${studentEmail}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: reminders.length,
      reminders,
    });
  } catch (error) { 
    logger.error('Error in inactivity reminders cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/cron/inactivity-reminders', _GET));
