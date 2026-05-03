import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/** List all promo codes */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return safeDbError(error, 'Failed to fetch promo codes');

    return NextResponse.json({ promo_codes: data });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch promo codes');
  }
}

/** Create a new promo code */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { code, discount_type, discount_value, ...rest } = body;

    if (!code) return safeError('code is required', 400);
    if (!discount_type) return safeError('discount_type is required', 400);
    if (discount_value == null) return safeError('discount_value is required', 400);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({ code: code.toUpperCase().trim(), discount_type, discount_value, ...rest })
      .select()
      .single();

    if (error) return safeDbError(error, 'Failed to create promo code');

    return NextResponse.json({ promo_code: data }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create promo code');
  }
}

/** Delete a promo code by id (passed as ?id=) */
export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return safeError('id is required', 400);

    const supabase = await createClient();
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);

    if (error) return safeDbError(error, 'Failed to delete promo code');

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete promo code');
  }
}
