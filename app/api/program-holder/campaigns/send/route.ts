import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/program-holder/campaigns/send
 *
 * Sends a bulk email to selected students enrolled in the program holder's programs.
 * Body: { subject, html_content, student_ids: string[] }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  const { user } = auth;

  const db = await getAdminClient();

  // Verify program_holder role
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || !['program_holder', 'admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: { subject: string; html_content: string; student_ids: string[] };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { subject, html_content, student_ids } = body;

  if (!subject?.trim()) return safeError('subject is required', 400);
  if (!html_content?.trim()) return safeError('html_content is required', 400);
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return safeError('student_ids must be a non-empty array', 400);
  }
  if (student_ids.length > 500) {
    return safeError('Cannot send to more than 500 students at once', 400);
  }

  // Fetch student emails — only students enrolled in this program holder's programs
  const { data: students, error: studentsErr } = await db
    .from('profiles')
    .select('id, email, full_name')
    .in('id', student_ids)
    .not('email', 'is', null);

  if (studentsErr) return safeDbError(studentsErr, 'Failed to fetch students');
  if (!students || students.length === 0) {
    return safeError('No valid students found', 404);
  }

  // Send via SendGrid
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    let sentCount = 0;
    const errors: string[] = [];

    for (const student of students) {
      if (!student.email) continue;
      try {
        await sendEmail({
          to: student.email,
          subject: subject.trim(),
          html: html_content,
          replyTo: profile.email ?? 'info@elevateforhumanity.org',
        });
        sentCount++;
      } catch (err: any) {
        errors.push(student.email);
      }
    }

    return NextResponse.json({
      sent_count: sentCount,
      failed_count: errors.length,
      ...(errors.length > 0 && { failed_emails: errors }),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to send campaign emails');
  }
}
