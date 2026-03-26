import { createAdminClient } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { enrollmentId } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Fetch enrollment details
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        student_id,
        courses!inner (
          title
        ),
        profiles!enrollments_student_id_fkey!inner (
          full_name,
          email
        )
      `
      )
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Type guards: Extract nested relations
    const profile = Array.isArray(enrollment.profiles)
      ? enrollment.profiles[0]
      : enrollment.profiles;
    const course = Array.isArray(enrollment.courses)
      ? enrollment.courses[0]
      : enrollment.courses;

    const studentName =
      profile?.full_name || profile?.email?.split('@')[0] || 'Student';
    const courseName = course?.title || 'Course';
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/learner/dashboard`;

    const html = emailTemplates.welcome(studentName, courseName, loginUrl);

    await sendEmail({
      to: profile?.email || '',
      subject: `Welcome to ${courseName} - Elevate for Humanity`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/emails/welcome', _POST);
