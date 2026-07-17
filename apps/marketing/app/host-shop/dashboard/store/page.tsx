'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShoppingCart,
  Plus,
  Sparkles,
  Users,
  CreditCard,
  FileCheck,
  Shield,
  Package,
  Check,
  ArrowRight,
  Star,
} from 'lucide-react';

const storeCategories = [
  {
    id: 'seats',
    name: 'Apprentice Seats',
    icon: Users,
    products: [
      { id: 'seat-1', name: '+1 Apprentice Seat', price: 29, period: '/month', description: 'Add one more apprentice to your plan' },
      { id: 'seat-5', name: '+5 Apprentice Seats', price: 99, period: '/month', description: 'Add five more apprentices to your plan', popular: true },
      { id: 'seat-10', name: '+10 Apprentice Seats', price: 179, period: '/month', description: 'Add ten more apprentices to your plan' },
    ],
  },
  {
    id: 'ai',
    name: 'AI Credits',
    icon: Sparkles,
    products: [
      { id: 'ai-100', name: '100 AI Credits', price: 9, period: '/month', description: 'For AI evaluations and report generation' },
      { id: 'ai-500', name: '500 AI Credits', price: 29, period: '/month', description: 'For growing AI feature usage', popular: true },
      { id: 'ai-1000', name: '1,000 AI Credits', price: 49, period: '/month', description: 'Best value for heavy AI usage' },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Package',
    icon: Shield,
    products: [
      { id: 'compliance-basic', name: 'Basic Compliance Export', price: 19, period: '/month', description: 'Export compliance reports in standard formats' },
      { id: 'compliance-full', name: 'Full Compliance Suite', price: 49, period: '/month', description: 'Complete audit prep and state reporting', popular: true },
    ],
  },
  {
    id: 'background',
    name: 'Background Checks',
    icon: FileCheck,
    products: [
      { id: 'bg-check-1', name: 'Background Check', price: 35, period: '/check', description: 'Complete background check for one apprentice' },
      { id: 'bg-check-5', name: '5 Background Checks', price: 149, period: '/pack', description: 'Package of 5 background checks', popular: true },
    ],
  },
];

export default function StorePage() {
  const [cart, setCart] = useState<Record<string, number>>({});

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const cartTotal = Object.keys(cart).length;
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Host Shop Store</p>
              </div>
            </div>
            <button className="relative flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-xl font-medium hover:bg-brand-blue-700 transition">
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartTotal > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Store</h1>
          <p className="text-slate-500">Purchase add-ons, credits, and services for your host shop</p>
        </div>

        {/* Featured Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Spring Special</h3>
                <p className="text-white/80">Get 20% off all AI credit packages this month!</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-white/90 transition">
              View Deals
            </button>
          </div>
        </div>

        {/* Product Categories */}
        <div className="space-y-8">
          {storeCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {category.products.map((product) => (
                  <div 
                    key={product.id}
                    className={`bg-white rounded-xl border-2 overflow-hidden ${
                      product.popular ? 'border-brand-blue-500 shadow-lg shadow-brand-blue-100' : 'border-slate-200'
                    }`}
                  >
                    {product.popular && (
                      <div className="bg-brand-blue-500 text-white text-center py-1.5 text-sm font-semibold">
                        Most Popular
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900">{product.name}</h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-brand-blue-600">${product.price}</span>
                          <span className="text-sm text-slate-500">{product.period}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{product.description}</p>
                      <button
                        onClick={() => addToCart(product.id)}
                        className="w-full py-2.5 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{cartItems.length} items in cart</p>
                  <p className="text-sm text-slate-500">Click checkout to complete your purchase</p>
                </div>
                <button className="px-8 py-3 bg-brand-blue-600 text-white rounded-xl font-bold hover:bg-brand-blue-700 transition flex items-center gap-2">
                  Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-slate-50 rounded-2xl p-6 mt-8 text-center">
          <h3 className="font-bold text-slate-900 mb-2">Need help choosing?</h3>
          <p className="text-sm text-slate-500 mb-4">
            Contact our sales team for custom solutions and volume discounts.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:underline">
            Contact Sales
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
