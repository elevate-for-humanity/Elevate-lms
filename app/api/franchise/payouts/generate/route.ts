import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { payoutService } from '@/lib/franchise/payout-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.officeId || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: officeId, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', body.officeId)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await payoutService.generateOfficePayouts(
      body.officeId,
      body.periodStart,
      body.periodEnd
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error generating payouts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate payouts' },
      { status: 500 }
    );
  }
}
