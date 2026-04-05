import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

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

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  let auth;
  try {
    auth = await apiRequireAdmin(req);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  try {
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
      userId: auth!.id,
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
  } catch (err) {
    return safeInternalError(err, 'Failed to process payout');
  }
}
