import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/authGuards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

// GET - Fetch all promo codes
async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ promoCodes });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
  }
}

// POST - Create new promo code
async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: body.code.toUpperCase().trim(),
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_purchase: body.min_purchase || 0,
        max_uses: body.max_uses,
        valid_until: body.valid_until,
        applies_to: body.applies_to || 'all',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await logAdminAudit({ action: AdminAction.PROMO_CODE_CREATED, actorId: auth.user.id, entityType: 'promo_codes', entityId: data.id, metadata: { code: data.code }, req });

    return NextResponse.json({ promoCode: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

// PUT - Update promo code
async function _PUT(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.min_purchase !== undefined) updateData.min_purchase = body.min_purchase;
    if (body.max_uses !== undefined) updateData.max_uses = body.max_uses;
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until;
    if (body.applies_to !== undefined) updateData.applies_to = body.applies_to;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await logAdminAudit({ action: AdminAction.PROMO_CODE_UPDATED, actorId: auth.user.id, entityType: 'promo_codes', entityId: body.id, metadata: { fields_updated: Object.keys(updateData) }, req });

    return NextResponse.json({ promoCode: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}

// DELETE - Delete promo code
async function _DELETE(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await logAdminAudit({ action: AdminAction.PROMO_CODE_DELETED, actorId: auth.user.id, entityType: 'promo_codes', entityId: id, metadata: {}, req });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/promo-codes', _GET);
export const POST = withApiAudit('/api/admin/promo-codes', _POST);
export const PUT = withApiAudit('/api/admin/promo-codes', _PUT);
export const DELETE = withApiAudit('/api/admin/promo-codes', _DELETE);
