/**
 * POST /api/paris/applications/[applicationId]/submit
 * 
 * Submit an application for review
 */

import { NextResponse } from 'next/server';
import { submitApplication } from '@/lib/paris/admissions/application-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 },
      );
    }
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }
    
    const token = authHeader.substring(7);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 },
      );
    }
    
    const { applicationId } = await context.params;
    
    const application = await submitApplication(applicationId, user.id);
    
    return NextResponse.json({
      success: true,
      applicationId: application.id,
      workflowStatus: application.workflow_status,
      redirectTo: `/applicant/application/${application.id}`,
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
