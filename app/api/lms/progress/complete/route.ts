import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

/**
 * Mark course as completed
 * POST /api/lms/progress/complete
 * Accepts both JSON and FormData
 */
export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON and FormData
    let courseId: string;
    let evidenceUrl: string | null = null;

    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      courseId = body.courseId;
      evidenceUrl = body.evidenceUrl || null;
    } else {
      const formData = await req.formData();
      courseId = String(formData.get('courseId') || '');
      evidenceUrl = String(formData.get('evidenceUrl') || '') || null;
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('slug')
      .eq('id', courseId)
      .single();

    // Update progress to completed
    const { error } = await supabase.from('lms_progress').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        course_slug: course?.slug,
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percent: 100,
        evidence_url: evidenceUrl,
        last_activity_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Get user profile for certificate
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Get course details
    const { data: courseDetails } = await supabase
      .from('courses')
      .select('title, metadata')
      .eq('id', courseId)
      .single();

    // Award points for course completion (100 points per course)
    try {
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ 
          points: supabase.rpc('coalesce_add', { current_val: 'points', add_val: 100 })
        })
        .eq('id', user.id);
      
      // Fallback: direct increment if RPC doesn't exist
      if (pointsError) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ points: (currentProfile?.points || 0) + 100 })
          .eq('id', user.id);
      }
    } catch (pointsErr) {
      logger.error("Points award failed", pointsErr instanceof Error ? pointsErr : undefined);
    }

    // Generate certificate
    try {
      const certificateNumber = `EFH-${Date.now()}-${courseId.substring(0, 8)}`;

      const { error: certError } = await supabase
        .from('module_certificates')
        .insert({
          user_id: user.id,
          module_id: courseId,
          certificate_number: certificateNumber,
          certificate_name: courseDetails?.title || 'Course Completion',
          issued_by: 'Elevate For Humanity',
          issued_date: new Date().toISOString().split('T')[0],
          student_name: profile?.full_name || 'Student',
        });

      if (certError) {
        /* Certificate error handled silently */
      }

      // Send completion email
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: profile?.email || user.email,
              subject: `Course Completed: ${courseDetails?.title}`,
              html: `
              <h2>Congratulations!</h2>
              <p>You have successfully completed <strong>${courseDetails?.title}</strong>!</p>
              <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
              <p>Your certificate is now available in your LMS dashboard.</p>
              <p><a href="https://www.elevateforhumanity.org/lms/certificates">View Your Certificates</a></p>
              <p>Best regards,<br>Elevate for Humanity Team</p>
            `,
            }),
          }
        );
      } catch (emailErr) {
        logger.error("Completion email failed", emailErr instanceof Error ? emailErr : undefined);
      }
    } catch (certError) {
      logger.error("Certificate generation failed", certError instanceof Error ? certError : undefined);
    }

    // Redirect if form submission, JSON response if API call
    if (
      contentType?.includes('application/x-www-form-urlencoded') ||
      contentType?.includes('multipart/form-data')
    ) {
      return NextResponse.redirect(
        new URL(`/lms/courses/${courseId}`, req.url)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Failed to complete course',
      },
      { status: 500 }
    );
  }
}
