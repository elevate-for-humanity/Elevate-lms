// PUBLIC ROUTE: marketplace public report
import { NextResponse } from 'next/server';

import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  const identifier = getClientIdentifier(req.headers);
  const rateLimitResult = rateLimit(identifier, {
    limit: 10,
    window: 60 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many reports. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { product_id, reporter_email, reason, details } = await req.json();

    if (!product_id || !reason) {
      return NextResponse.json(
        { error: 'Product ID and reason are required' },
        { status: 400 }
      );
    }

    const { data: product } = await supabase
      .from('marketplace_products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error } = await supabase.from('product_reports').insert({
      product_id,
      reporter_email: reporter_email || null,
      reason,
      details: details || null,
      status: 'pending',
    });

    if (error) throw error;

    await logAuditEvent({
      action: 'PRODUCT_REPORTED',
      resourceType: 'marketplace_product',
      resourceId: product_id,
      metadata: { reporter_email, reason },
      ipAddress: identifier,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
