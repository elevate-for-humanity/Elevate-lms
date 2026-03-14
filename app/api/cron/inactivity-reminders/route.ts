import { createClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

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
    const supabase = await createClient();

    // Find students who haven't logged in for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all active enrollments
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        student_id,
        courses!inner (
          id,
          title
        ),
        profiles!enrollments_student_id_fkey!inner (
          full_name,
          email
        )
      `
      )
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: 'No active enrollments found' });
    }

    const studentIds = enrollments.map((e) => e.student_id);

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
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/lms/dashboard`;

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
export const GET = withApiAudit('/api/cron/inactivity-reminders', _GET);
