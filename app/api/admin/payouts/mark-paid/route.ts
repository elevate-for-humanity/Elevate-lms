import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function getSupabaseAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = getSupabaseAdmin();
  try {
    const { session } = await requireAdmin();
    const { creatorId } = await req.json();
    const { ipAddress } = getRequestMetadata(req);

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID required' },
        { status: 400 }
      );
    }

    // Get total amount being paid out
    const { data: salesData } = await supabase
      .from('marketplace_sales')
      .select('creator_earnings_cents')
      .eq('creator_id', creatorId)
      .eq('paid_out', false);

    const totalAmount =
      salesData?.reduce((sum, sale) => sum + sale.creator_earnings_cents, 0) ||
      0;

    // Mark all unpaid sales for this creator as paid
    const { data, error }: any = await supabase
      .from('marketplace_sales')
      .update({
        paid_out: true,
        payout_date: new Date().toISOString(),
      })
      .eq('creator_id', creatorId)
      .eq('paid_out', false)
      .select();

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      userId: session.user.id,
      action: AuditActions.MARKETPLACE_PAYOUT_PROCESSED,
      resourceType: 'marketplace_creator',
      resourceId: creatorId,
      metadata: {
        amount_cents: totalAmount,
        sales_count: data?.length || 0,
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      salesUpdated: data?.length || 0,
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json({ err: toErrorMessage(err) }, { status: 500 });
  }
}
