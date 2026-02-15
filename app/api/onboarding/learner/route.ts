import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.json();

    // Save learner onboarding data to database
    const { error: insertError } = await supabase
      .from('learner_onboarding')
      .insert({
        user_id: session.user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        address: formData.address,
        emergency_name: formData.emergency_name,
        emergency_phone: formData.emergency_phone,
        program: formData.program,
        employment_status: formData.employment_status,
        support_needs: formData.support_needs,
        goals: formData.goals,
        attendance_commitment: formData.attendance_commitment,
        handbook_read: formData.handbook_read,
        privacy_understood: formData.privacy_understood,
        signature: formData.signature,
        submitted_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Update profile to mark onboarding as started
    await supabase
      .from('profiles')
      .update({
        onboarding_started: true,
        onboarding_started_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Learner onboarding submitted successfully',
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Learner onboarding error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to submit onboarding' },
      { status: 500 }
    );
  }
}
