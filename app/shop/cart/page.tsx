import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, CreditCard, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CartItems from './CartItems';

export const metadata: Metadata = {
  title: 'Shopping Cart | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ShoppingCartPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/shop/cart');
  }

  // Fetch cart items with product details
  const { data: cartData } = await supabase
    .from('cart_items')
    .select('id, quantity, product_id, products(id, name, description, price, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = (cartData || []).map((item: any) => ({
    cart_item_id: item.id,
    product_id: item.product_id,
    name: item.products?.name || 'Unknown Product',
    description: item.products?.description || '',
    price: item.products?.price || 0,
    quantity: item.quantity || 1,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Cart' }]} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-slate-700 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CartItems items={items} />
              <Link href="/shop/products" className="inline-flex items-center gap-2 mt-4 text-brand-blue-600 hover:text-brand-blue-700">
                <ShoppingCart className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>

            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Tax (7%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-slate-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Link href="/store" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium">
                  <CreditCard className="w-5 h-5" /> Proceed to Checkout
                </Link>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-700">
                  <Lock className="w-4 h-4" /> Secure checkout
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-700 mb-6">Browse our products and add items to your cart.</p>
            <Link href="/shop/products" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
