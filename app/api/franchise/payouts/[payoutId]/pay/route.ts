import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { payoutService } from '@/lib/franchise/payout-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payoutId } = await params;
    const body = await request.json();

    if (!body.method || !body.reference) {
      return NextResponse.json(
        { error: 'Missing required fields: method, reference' },
        { status: 400 }
      );
    }

    // Get payout to check office
    const payout = await payoutService.getPayout(payoutId);
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
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
        .eq('id', payout.office_id)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await payoutService.markPaid(payoutId, {
      method: body.method,
      reference: body.reference
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error marking payout as paid:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark payout as paid' },
      { status: 500 }
    );
  }
}
