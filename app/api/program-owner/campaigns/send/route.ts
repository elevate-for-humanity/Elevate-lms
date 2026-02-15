export const dynamic = 'force-dynamic';
// Using Node.js runtime for email compatibility
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
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

    // Verify program owner has access to these students through their programs
    const { data: ownedPrograms } = await supabase
      .from('programs')
      .select('id')
      .eq('owner_id', user.id);

    if (!ownedPrograms || ownedPrograms.length === 0) {
      return NextResponse.json({ error: 'No programs found' }, { status: 403 });
    }

    const programIds = ownedPrograms.map((p) => p.id);

    // Get enrollments for owned programs
    const { data: enrollments } = await supabase
      .from('enrollments')
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
      } catch (error) { /* Error handled silently */ 
  }
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      total_selected: students.length,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Failed to send emails',
      },
      { status: 500 }
    );
  }
}
