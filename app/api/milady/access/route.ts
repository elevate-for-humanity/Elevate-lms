import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/milady/access
 * Get student's Milady access information
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || user.id;
    const programSlug = searchParams.get('programSlug');

    if (!programSlug) {
      return NextResponse.json({ error: 'programSlug required' }, { status: 400 });
    }

    // Security: Only allow users to view their own access (unless admin)
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    if (studentId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Milady access record
    const { data: access, error } = await db
      .from('milady_access')
      .select('*')
      .eq('student_id', studentId)
      .eq('program_slug', programSlug)
      .single();

    if (error || !access) {
      // Check if student has active enrollment (payment completed, docs verified)
      const { data: enrollment } = await db
        .from('enrollments')
        .select('id, status, docs_verified')
        .eq('user_id', studentId)
        .eq('status', 'active')
        .single();

      if (enrollment) {
        // Has active enrollment - return active with default Milady URL
        return NextResponse.json({
          status: 'active',
          method: 'link',
          accessUrl: 'https://www.miladytraining.com/users/sign_in',
          enrollmentId: enrollment.id,
        });
      }

      // Check for pending enrollment (paid but not yet approved)
      const { data: pendingEnrollment } = await db
        .from('enrollments')
        .select('id, status, docs_verified')
        .eq('user_id', studentId)
        .eq('status', 'pending')
        .single();

      if (pendingEnrollment) {
        return NextResponse.json({
          status: 'pending_approval',
          docsVerified: pendingEnrollment.docs_verified,
          message: pendingEnrollment.docs_verified 
            ? 'Your enrollment is pending admin approval.'
            : 'Please upload required documents to complete enrollment.',
        });
      }

      return NextResponse.json({
        status: 'not_provisioned',
      });
    }

    return NextResponse.json({
      status: access.status,
      method: access.provisioning_method,
      accessUrl: access.access_url,
      licenseCode: access.license_code,
      username: access.username,
      provisionedAt: access.provisioned_at,
    });
  } catch (error) {
    logger.error('[Milady Access API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/milady/access
 * Provision Milady access for a student (admin only or self after payment)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, programSlug } = await request.json();

    if (!studentId || !programSlug) {
      return NextResponse.json(
        { error: 'studentId and programSlug required' },
        { status: 400 }
      );
    }

    // Get student profile
    const { data: studentProfile } = await db
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Import and run provisioning
    const { provisionMiladyAccess } = await import('@/lib/vendors/milady-provisioning');
    
    const result = await provisionMiladyAccess(
      {
        id: studentId,
        email: studentProfile.email,
        firstName: studentProfile.first_name || studentProfile.full_name?.split(' ')[0] || 'Student',
        lastName: studentProfile.last_name || studentProfile.full_name?.split(' ').slice(1).join(' ') || '',
        phone: studentProfile.phone,
      },
      programSlug
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[Milady Access API] Provision error:', error);
    return NextResponse.json(
      { error: 'Failed to provision access' },
      { status: 500 }
    );
  }
}
