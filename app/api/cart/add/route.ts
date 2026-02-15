import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 1;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
    } else {
      // Add new item
      await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });
    }

    // Redirect back to referring page or cart
    const referer = req.headers.get('referer') || '/store/cart';
    return NextResponse.redirect(referer, 303);
  } catch (error) {
    logger.error('Cart add error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
