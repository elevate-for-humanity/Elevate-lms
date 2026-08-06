/**
 * POST /api/paris/applications/[applicationId]/decision
 * 
 * Record admissions decision (staff only)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordAdmissionsDecision } from '@/lib/paris/admissions/application-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const decisionSchema = z.object({
  decision: z.enum([
    'PENDING',
    'CONDITIONAL_ACCEPTANCE',
    'ACCEPTED',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
  ]),
  reason: z.string().max(4000).optional(),
  conditions: z.array(z.string().max(500)).default([]),
});

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
    
    // Verify admin/staff authentication
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
    
    // Check if user has admissions role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const allowedRoles = ['admin', 'super_admin', 'staff', 'admissions', 'recruiter'];
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
      );
    }
    
    const { applicationId } = await context.params;
    const input = decisionSchema.parse(await request.json());
    
    const result = await recordAdmissionsDecision(
      applicationId,
      {
        decision: input.decision,
        reason: input.reason,
        conditions: input.conditions,
      },
      user.id,
    );
    
    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      workflowStatus: result.currentStatus,
      admissionsDecision: input.decision,
    });
  } catch (error) {
    console.error('paris.decision.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to record decision',
      },
      { status: 400 },
    );
  }
}
