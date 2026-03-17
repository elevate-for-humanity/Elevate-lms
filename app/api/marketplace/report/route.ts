import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import {
  rateLimit,
import { logAuditEvent } from '@/lib/audit';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
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
