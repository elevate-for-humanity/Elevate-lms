/**
 * POST /api/paris/applications/[applicationId]/submit
 * 
 * Submit an application for review
 */

import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { submitApplication } from '@/lib/paris/admissions/application-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
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
    
    const { applicationId } = await context.params;
    
    const result = await submitApplication(applicationId, user.id);
    
    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      workflowStatus: result.currentStatus,
      redirectTo: `/applicant/application/${result.applicationId}`,
    });
  } catch (error) {
    console.error('paris.application.submit.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to submit application',
      },
      { status: 400 },
    );
  }
}
