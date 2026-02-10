import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/authGuards';

export const dynamic = 'force-dynamic';

// GET - Fetch all promo codes
export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const supabase = createAdminClient();

    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promoCodes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
  }
}

// POST - Create new promo code
export async function POST(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const body = await req.json();
    const supabase = createAdminClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promoCode: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

// PUT - Update promo code
export async function PUT(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const body = await req.json();
    const supabase = createAdminClient();

    const updateData: any = {};
    
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promoCode: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}

// DELETE - Delete promo code
export async function DELETE(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
  }
}
