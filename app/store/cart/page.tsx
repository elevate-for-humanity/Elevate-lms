import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shopping Cart | Elevate for Humanity',
  description: 'Review your cart and proceed to checkout.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  // Show empty cart for guests instead of redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/store" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Sign in to view your cart or browse our store.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/store/cart"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700"
              >
                Sign In
              </Link>
              <Link
                href="/store"
                className="inline-flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get cart items with product details
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:products(
        id,
        name,
        price,
        image_url,
        type
      )
    `)
    .eq('user_id', user.id);

  const subtotal = cartItems?.reduce((sum: number, item: any) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0) || 0;

  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Cart" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/store" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
        </div>

        {cartItems && cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.product?.image_url ? (
                        <Image 
                          src={item.product.image_url} 
                          alt={item.product.name} 
                          fill
                          className="object-cover" 
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product?.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.product?.type}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <form action={`/api/cart/update`} method="POST">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="quantity" value={item.quantity - 1} />
                            <button 
                              type="submit"
                              className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </form>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <form action={`/api/cart/update`} method="POST">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="quantity" value={item.quantity + 1} />
                            <button 
                              type="submit"
                              className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                          </span>
                          <form action={`/api/cart/remove`} method="POST">
                            <input type="hidden" name="itemId" value={item.id} />
                            <button 
                              type="submit"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (7%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href="/store/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </Link>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Browse our store to find resources that support your journey.</p>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
