// Using Node.js runtime for email compatibility

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
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

    if (!profile || profile.role !== 'program_owner') {
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

    // Verify program holder has access to these students through their programs
    const { data: holderProfile } = await supabase
      .from('profiles')
      .select('program_holder_id')
      .eq('id', user.id)
      .single();

    if (!holderProfile?.program_holder_id) {
      return NextResponse.json({ error: 'No program holder record found' }, { status: 403 });
    }

    const { data: associations } = await supabase
      .from('program_holder_programs')
      .select('program_id')
      .eq('program_holder_id', holderProfile.program_holder_id)
      .eq('status', 'active');

    if (!associations || associations.length === 0) {
      return NextResponse.json({ error: 'No programs found' }, { status: 403 });
    }

    const programIds = associations.map((a: any) => a.program_id);

    // Get enrollments for owned programs
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('student_id')
      .in('program_id', programIds)
      .in('student_id', student_ids);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No valid students found in your programs' },
        { status: 403 }
      );
    }

    const validStudentIds = enrollments.map((e) => e.student_id);

    // Get student details
    const { data: students } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', validStudentIds);

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
        .replace(/\{\{support_email\}\}/g, 'support@elevateforhumanity.org')
        .replace(/\{\{support_phone\}\}/g, '(555) 123-4567');

      try {
        await resend.emails.send({
          from: `${profile.full_name} <noreply@elevateforhumanity.org>`,
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
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/program-owner/campaigns/send', _POST);
