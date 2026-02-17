"use client";

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, ShoppingCart as CartIcon, Plus, Minus, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export function ShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const fetchCart = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Load from localStorage for guests
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        setCartItems(JSON.parse(localCart));
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('cart_items')
        .select('*, products(name, price, image_url)')
        .eq('user_id', user.id);

      if (data) {
        const items: CartItem[] = data.map(item => ({
          id: item.product_id,
          title: item.products?.name || 'Product',
          price: item.products?.price || 0,
          image: item.products?.image_url || '/media/courses/default.jpg',
          quantity: item.quantity,
        }));
        setCartItems(items);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (id: string, change: number) => {
    const newItems = cartItems.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    );
    setCartItems(newItems);

    // Sync to database
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const item = newItems.find(i => i.id === id);
      if (item) {
        await supabase
          .from('cart_items')
          .update({ quantity: item.quantity })
          .eq('user_id', user.id)
          .eq('product_id', id);
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'SAVE20') {
      setDiscount(0.2);
    } else if (promoCode.toUpperCase() === 'FIRST10') {
      setDiscount(0.1);
    } else {
      alert('Invalid promo code');
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CartIcon size={24} />
                  Shopping Cart ({cartItems.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <CartIcon className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-black mb-6">
                    Browse our courses and add them to your cart
                  </p>
                  <Link href="/programs">
                    <Button className="bg-brand-orange-600 hover:bg-brand-orange-700">
                      Browse Courses
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="relative w-32 h-20 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <div className="text-lg font-bold text-brand-orange-600">
                          ${(item.price / 100).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border rounded">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-brand-orange-600 hover:bg-brand-red-50 rounded transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-black">Subtotal</span>
                  <span className="font-semibold">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-brand-green-600">
                    <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                    <span>-${(discountAmount / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-brand-orange-600">
                      ${(total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={16} className="text-black" />
                  <span className="text-sm font-semibold">Promo Code</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                  <Button
                    onClick={applyPromoCode}
                    variant="outline"
                    className="border-brand-red-600 text-brand-orange-600 hover:bg-brand-red-50"
                  >
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <div className="mt-2 text-sm text-brand-green-600">
                    • Promo code applied!
                  </div>
                )}
              </div>

              <Button
                disabled={cartItems.length === 0}
                className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 py-6 text-lg"
              >
                Proceed to Checkout
              </Button>

              <div className="text-center text-sm text-black">
                <p>30-day money-back guarantee</p>
                <p>Secure checkout with SSL encryption</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
