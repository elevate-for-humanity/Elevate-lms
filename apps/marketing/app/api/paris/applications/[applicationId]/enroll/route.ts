/**
 * POST /api/paris/applications/[applicationId]/enroll
 * 
 * Enroll accepted applicant into LMS
 */

import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { enrollAcceptedApplicant } from '@/lib/paris/admissions/enrollment-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    // Verify admin/staff authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }
    
    const token = authHeader.substring(7);
    const supabase = createPublicClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 },
      );
    }
    
    // Check if user has registrar/admissions role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const allowedRoles = ['admin', 'super_admin', 'staff', 'admissions', 'registrar'];
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
      );
    }
    
    const { applicationId } = await context.params;
    
    const enrollment = await enrollAcceptedApplicant({
      applicationId,
      enrolledById: user.id,
    });
    
    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      lmsUserId: enrollment.lmsUserId,
      dashboardId: enrollment.dashboardId,
      apprenticeRecordId: enrollment.apprenticeRecordId,
      redirectTo: `/learner/dashboard?enrollment=${enrollment.dashboardId}`,
    });
  } catch (error) {
    console.error('paris.enrollment.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to complete enrollment',
      },
      { status: 400 },
    );
  }
}
