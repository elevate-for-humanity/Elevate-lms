import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL('/login?redirect=/store/cart', request.url), 303);

  const form = await request.formData().catch(() => null);
  const itemId = String(form?.get('itemId') || '').trim();
  const url = new URL('/store/cart', request.url);

  if (!/^[0-9a-f-]{36}$/i.test(itemId)) {
    url.searchParams.set('error', 'cart-remove-invalid');
    return NextResponse.redirect(url, 303);
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) url.searchParams.set('error', 'cart-remove-failed');
  return NextResponse.redirect(url, 303);
}
