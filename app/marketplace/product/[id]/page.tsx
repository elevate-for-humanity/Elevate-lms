import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Marketplace Product',
  description: 'Digital products and resources from Elevate for Humanity creators.',
  path: '/marketplace',
});

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import ProductCheckoutButton from './ProductCheckoutButton';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: product } = await supabase
    .from('marketplace_products')
    .select(
      `
      *,
      creator:marketplace_creators(display_name, bio)
    `
    )
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "[Id]" }]} />
      </div>
<div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-white flex items-center justify-center">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <svg
                  className="w-32 h-32 text-white opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            {/* Product Details */}
            <div className="p-8">
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-white font-bold">
                  {product.creator?.display_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm text-black">Created by</p>
                  <p className="font-semibold">
                    {product.creator?.display_name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-brand-blue-600">
                  ${(product.price_cents / 100).toFixed(2)}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-black whitespace-pre-wrap">
                  {product.description || 'No description available.'}
                </p>
              </div>

              <ProductCheckoutButton
                productId={product.id}
                creatorId={product.creator_id}
                priceCents={product.price_cents}
                productTitle={product.title}
              />

              <div className="mt-6 p-4 bg-brand-blue-50 rounded-lg">
                <h3 className="font-semibold text-brand-blue-900 mb-2">
                  What you'll get:
                </h3>
                <ul className="text-sm text-brand-blue-800 space-y-1">
                  <li>• Instant digital download</li>
                  <li>• Lifetime access</li>
                  <li>• Support from creator</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Bio */}
        {product.creator?.bio && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">About the Creator</h2>
            <p className="text-black">{product.creator.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
