export const dynamic = 'force-dynamic';
// Using Node.js runtime for email compatibility
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { subject, html_content, student_ids } = body;

    if (!student_ids || student_ids.length === 0) {
      return NextResponse.json(
        { error: 'No students selected' },
        { status: 400 }
      );
    }

    // Get student details
    const { data: students } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', student_ids);

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'No valid students found' },
        { status: 400 }
      );
    }

    let sentCount = 0;

    // Send emails
    for (const student of students) {
      const personalizedContent = html_content
        .replace(/\{\{student_name\}\}/g, student.full_name || 'Student')
        .replace(/\{\{user_name\}\}/g, student.full_name || 'Student')
        .replace(/\{\{organization_name\}\}/g, 'Elevate for Humanity')
        .replace(
          /\{\{dashboard_link\}\}/g,
          'https://www.elevateforhumanity.org/dashboard'
        )
        .replace(/\{\{support_email\}\}/g, 'support@www.elevateforhumanity.org')
        .replace(/\{\{support_phone\}\}/g, '(555) 123-4567');

      try {
        await resend.emails.send({
          from: `${profile.full_name} <noreply@www.elevateforhumanity.org>`,
          to: student.email,
          subject,
          html: personalizedContent,
        });

        sentCount++;
      } catch (error) {
          logger.error("Unhandled error", error instanceof Error ? error : undefined);
  }
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      total_selected: students.length,
    });
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          ('Internal server error') ||
          'Failed to send emails',
      },
      { status: 500 }
    );
  }
}
