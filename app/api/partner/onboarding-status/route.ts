import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ completed: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Check if partner has completed onboarding
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, shop_name, onboarding_completed, onboarding_step, status')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ 
        completed: false, 
        step: 'not_started',
        message: 'No partner profile found'
      });
    }

    // Check if onboarding is completed
    const isCompleted = partner.onboarding_completed === true && partner.status === 'active';

    return NextResponse.json({
      completed: isCompleted,
      step: partner.onboarding_step || 'not_started',
      shopName: partner.shop_name,
      status: partner.status,
    });

  } catch (error) {
    logger.error('Error checking onboarding status:', error);
    return NextResponse.json({ completed: false, error: 'Server error' }, { status: 500 });
  }
}
