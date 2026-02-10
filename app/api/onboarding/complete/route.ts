import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark onboarding as complete
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Send welcome email with LMS access info
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-welcome`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile?.email || user.email,
          name: profile?.full_name || 'Student',
          userId: user.id,
        }),
      }
    );

    if (!emailResponse.ok) {
      logger.error('Failed to send welcome email');
    }

    return NextResponse.json({
      success: true,
      message:
        'Onboarding completed! Check your email for LMS access instructions.',
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Onboarding completion error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
