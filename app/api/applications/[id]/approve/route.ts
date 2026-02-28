import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sendgrid';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if user is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get application
    const { data: application, error: appError } = await db
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'approved') {
      return NextResponse.json({ error: 'Application already approved' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { courseId, programId } = body;

    // Update application status
    const { error: updateError } = await db
      .from('applications')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
    }

    // Check if user profile exists, create if not
    let studentId = null;
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .eq('email', application.email)
      .single();

    if (existingProfile) {
      studentId = existingProfile.id;
    } else {
      // Create auth user and profile
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: application.email,
        email_confirm: true,
        user_metadata: {
          first_name: application.first_name,
          last_name: application.last_name,
        },
      });

      if (!authError && authData.user) {
        studentId = authData.user.id;
        
        await db.from('profiles').insert({
          id: studentId,
          email: application.email,
          first_name: application.first_name,
          last_name: application.last_name,
          role: 'student',
        });
      }
    }

    // Create enrollment if courseId provided
    let enrollment = null;
    if (studentId && courseId) {
      const { data: enrollData } = await db
        .from('program_enrollments')
        .insert({
          user_id: studentId,
          course_id: courseId,
          status: 'active',
          progress: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      enrollment = enrollData;
    }

    // Send approval email to applicant
    await sendEmail({
      to: application.email,
      subject: 'Application Approved! - Elevate for Humanity',
      html: `
        <h2>Congratulations, ${application.first_name}!</h2>
        <p>Your application has been <strong style="color: #10b981;">approved</strong>!</p>
        <p>We're excited to have you join our program.</p>
        <h3>Next Steps:</h3>
        <ol>
          <li>Check your email for login instructions</li>
          <li>Complete your student profile</li>
          <li>Start your first course</li>
        </ol>
        <p style="margin-top: 20px;">
          <a href="https://www.elevateforhumanity.org/lms/dashboard" 
             style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Student Dashboard
          </a>
        </p>
        <p>Questions? Call us at <a href="tel:317-314-3757">317-314-3757</a></p>
        <p>Welcome to Elevate for Humanity!<br>The Admissions Team</p>
      `,
    });

    return NextResponse.json({
      success: true,
      applicationId: id,
      status: 'approved',
      studentId,
      enrollment,
    });
  } catch (error) {
    logger.error('Application approval error:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/applications/[id]/approve', _POST);
