import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Get or create cart
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const cookieStore = await cookies();
  const cartId = cookieStore.get('cart_id')?.value;
  const sessionId = cookieStore.get('session_id')?.value || crypto.randomUUID();

  try {
    let cart = null;
    
    if (cartId) {
      cart = await getCart(cartId);
    }

    if (!cart) {
      // Create new cart
      const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
      if (!supabase) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
      }

      const { data: newCart, error } = await db
        .from('carts')
        .insert({ session_id: sessionId })
        .select()
        .single();

      if (error) {
        logger.error('Error creating cart:', error);
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }

      cart = { ...newCart, items: [], item_count: 0 };

      // Set cart cookie
      const response = NextResponse.json({ cart });
      response.cookies.set('cart_id', newCart.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    return NextResponse.json({ cart });
  } catch (error) {
    logger.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const cookieStore = await cookies();
  const cartId = cookieStore.get('cart_id')?.value;

  if (!cartId) {
    return NextResponse.json({ error: 'No cart found' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { productId, quantity = 1, variantId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const item = await addToCart(cartId, productId, quantity, variantId);
    
    if (!item) {
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }

    const cart = await getCart(cartId);
    return NextResponse.json({ cart, item });
  } catch (error) {
    logger.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// Update cart item
export async function PATCH(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Item ID and quantity required' }, { status: 400 });
    }

    if (quantity <= 0) {
      const success = await removeFromCart(itemId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
      }
    } else {
      const item = await updateCartItem(itemId, quantity);
      if (!item) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
      }
    }

    const cookieStore = await cookies();
    const cartId = cookieStore.get('cart_id')?.value;
    const cart = cartId ? await getCart(cartId) : null;

    return NextResponse.json({ cart });
  } catch (error) {
    logger.error('Cart PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get('itemId');

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
  }

  try {
    const success = await removeFromCart(itemId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const cartId = cookieStore.get('cart_id')?.value;
    const cart = cartId ? await getCart(cartId) : null;

    return NextResponse.json({ cart });
  } catch (error) {
    logger.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}
