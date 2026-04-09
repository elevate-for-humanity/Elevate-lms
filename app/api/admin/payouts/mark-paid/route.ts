import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

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

  const supabase = await getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  try {
    const { creatorId } = await req.json();
    const { ipAddress } = getRequestMetadata(req);

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    // Verify creator exists before mutating
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', creatorId)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Get total amount being paid out — fail loudly if query fails
    const { data: salesData, error: salesError } = await supabase
      .from('marketplace_sales')
      .select('creator_earnings_cents')
      .eq('creator_id', creatorId)
      .eq('paid_out', false);

    if (salesError) {
      return safeInternalError(salesError, 'Failed to fetch unpaid sales');
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json({ error: 'No unpaid sales found for this creator' }, { status: 404 });
    }

    const totalAmount = salesData.reduce((sum, sale) => sum + (sale.creator_earnings_cents ?? 0), 0);

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
