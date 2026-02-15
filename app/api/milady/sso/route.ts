import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { MiladyAPI } from '@/lib/partners/milady';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .select(
        `
        *,
        course:partner_lms_courses(*),
        provider:partner_lms_providers(*)
      `
      )
      .eq('id', enrollmentId)
      .eq('student_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Verify this is a Milady enrollment
    if (enrollment.provider?.provider_type !== 'milady') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Initialize Milady API
    const miladyAPI = new MiladyAPI({
      apiKey: process.env.MILADY_API_KEY || '',
      apiSecret: process.env.MILADY_API_SECRET || '',
      baseUrl:
        process.env.MILADY_API_URL || 'https://api.miladytraining.com/v1',
    });

    // Generate SSO launch URL
    const ssoUrl = await miladyAPI.getSsoLaunchUrl({
      accountExternalId: enrollment.external_student_id || user.id,
      externalEnrollmentId: enrollment.external_enrollment_id || enrollment.id,
      returnTo: `${process.env.NEXT_PUBLIC_SITE_URL}/student/dashboard`,
    });

    // Update last accessed timestamp
    await supabase
      .from('partner_lms_enrollments')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', enrollmentId);

    return NextResponse.json({
      success: true,
      ssoUrl,
      courseName: enrollment.course_name,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Failed to generate SSO URL' },
      { status: 500 }
    );
  }
}
