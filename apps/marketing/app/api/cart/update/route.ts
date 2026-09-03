import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cartUrl(request: NextRequest, error?: string) {
  const url = new URL('/store/cart', request.url);
  if (error) url.searchParams.set('error', error);
  return url;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL('/login?redirect=/store/cart', request.url), 303);

  const form = await request.formData().catch(() => null);
  const itemId = String(form?.get('itemId') || '').trim();
  const quantity = Number(form?.get('quantity'));

  if (!/^[0-9a-f-]{36}$/i.test(itemId) || !Number.isInteger(quantity) || quantity < 0 || quantity > 10) {
    return NextResponse.redirect(cartUrl(request, 'cart-update-invalid'), 303);
  }

  if (quantity === 0) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);
    return NextResponse.redirect(cartUrl(request, error ? 'cart-update-failed' : undefined), 303);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .eq('user_id', user.id);

  return NextResponse.redirect(cartUrl(request, error ? 'cart-update-failed' : undefined), 303);
}
