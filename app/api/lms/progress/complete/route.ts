import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const _admin = createAdminClient(); const db = _admin || supabase;
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
    const { data: course } = await db
      .from('courses')
      .select('slug')
      .eq('id', courseId)
      .single();

    // Update progress to completed
    const { error } = await db.from('lms_progress').upsert(
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
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Get course details
    const { data: courseDetails } = await db
      .from('courses')
      .select('title, metadata')
      .eq('id', courseId)
      .single();

    // Award points for course completion (100 points per course)
    try {
      const { error: pointsError } = await db
        .from('profiles')
        .update({ 
          points: supabase.rpc('coalesce_add', { current_val: 'points', add_val: 100 })
        })
        .eq('id', user.id);
      
      // Fallback: direct increment if RPC doesn't exist
      if (pointsError) {
        const { data: currentProfile } = await db
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();
        
        await db
          .from('profiles')
          .update({ points: (currentProfile?.points || 0) + 100 })
          .eq('id', user.id);
      }
    } catch (pointsErr) {
      logger.error("Points award failed", pointsErr instanceof Error ? pointsErr : undefined);
    }

    // Generate certificate via canonical service
    try {
      const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
      await issueCertificate({
        supabase,
        studentId: user.id,
        courseId,
        studentName: profile?.full_name || 'Student',
        studentEmail: profile?.email || user.email || undefined,
        courseTitle: courseDetails?.title || 'Course Completion',
      });
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
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
