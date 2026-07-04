import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Mail,
  ArrowRight,
  Package,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Successful',
  description: 'Your order has been completed successfully.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StoreSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/store');
  }

  const orderId = order_id;

  // Get order details
  let order = null;
  let orderItems = null;

  if (orderId) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();
    order = orderData;

    if (order) {
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          product:products(id, name, type, download_url)
        `)
        .eq('order_id', orderId);
      orderItems = items;
    }
  }

  // Get user's recent purchases for downloads
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      id,
      product:products(id, name, download_url, type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image src="/images/pages/store-success-hero.webp" alt="Elevate store" fill sizes="100vw" className="object-cover" priority placeholder="empty" />
      </section>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-slate-700 mb-8">
            Your purchase was successful. A confirmation email has been sent to your inbox.
          </p>

          {order && (
            <div className="bg-white rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">Order ID</span>
                  <span className="font-mono">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Date</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Total</span>
                  <span className="font-bold">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {orderItems && orderItems.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold mb-4 text-left">Your Items</h2>
              <div className="space-y-3">
                {orderItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-slate-700" />
                      <div className="text-left">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-slate-700 capitalize">{item.product?.type}</p>
                      </div>
                    </div>
                    {item.product?.download_url && (
                      <a
                        href={item.product.download_url}
                        className="flex items-center gap-1 text-brand-green-600 font-medium hover:underline"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downloads Section */}
          {purchases && purchases.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold mb-4 text-left">Your Downloads</h2>
              <div className="space-y-2">
                {purchases.filter((p: any) => p.product?.download_url).map((purchase: any) => (
                  <a
                    key={purchase.id}
                    href={purchase.product.download_url}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-white"
                  >
                    <span>{purchase.product.name}</span>
                    <Download className="w-5 h-5 text-brand-green-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-slate-700 mb-8">
            <Mail className="w-4 h-4" />
            <span>Receipt sent to {user.email}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-red-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-white"
            >
              View All Orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
