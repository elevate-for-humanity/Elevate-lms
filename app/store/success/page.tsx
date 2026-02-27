import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Mail,
  ArrowRight,
  Package,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Successful | Elevate for Humanity',
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
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  if (!user) {
    redirect('/login?redirect=/store');
  }

  const orderId = order_id;

  // Get order details
  let order = null;
  let orderItems = null;

  if (orderId) {
    const { data: orderData } = await db
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();
    order = orderData;

    if (order) {
      const { data: items } = await db
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
  const { data: purchases } = await db
    .from('purchases')
    .select(`
      id,
      product:products(id, name, download_url, type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Elevate store" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-gray-600 mb-8">
            Your purchase was successful. A confirmation email has been sent to your inbox.
          </p>

          {order && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
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
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-gray-400" />
                      <div className="text-left">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{item.product?.type}</p>
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
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span>{purchase.product.name}</span>
                    <Download className="w-5 h-5 text-brand-green-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
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
              href="/shop/orders"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              View All Orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
