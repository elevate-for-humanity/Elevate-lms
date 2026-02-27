import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Fetch sale details
    const { data: sale, error } = await supabase
      .from('marketplace_sales')
      .select(
        `
        *,
        product:marketplace_products(title),
        creator:marketplace_creators(display_name)
      `
      )
      .eq('stripe_session_id', sessionId)
      .single();

    if (error || !sale) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      productTitle: sale.product?.title,
      creatorName: sale.creator?.display_name,
      amount: sale.amount_cents,
      email: sale.buyer_email,
      downloadUrl: sale.download_token
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/download/${sale.download_token}`
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ err: toErrorMessage(err) }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/marketplace/purchase-details', _GET);
