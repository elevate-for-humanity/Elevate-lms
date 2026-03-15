import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Creator Products | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { requireCreator } from '@/lib/creator';
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';


export default async function CreatorProductsPage() {
  const { creator } = await requireCreator();
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Fetch creator's products
  const { data: products } = await db
    .from('marketplace_products')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  // Fetch sales count for each product
  const { data: salesData } = await db
    .from('marketplace_sales')
    .select('product_id')
    .eq('creator_id', creator.id);

  const salesByProduct =
    salesData?.reduce((acc: any, sale) => {
      acc[sale.product_id] = (acc[sale.product_id] || 0) + 1;
      return acc;
    }, {}) || {};

  return (
    <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Creator", href: "/creator" }, { label: "Products" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Products</h1>
            <p className="text-black">
              Manage your digital products and track performance
            </p>
          </div>
          <Link
            href="/creator/products"
            className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Add New Product
          </Link>
        </div>

        {!products || products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-brand-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
            <p className="text-black mb-6">
              Create your first product to start selling on the marketplace.
            </p>
            <Link
              href="/creator/products"
              className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Create First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const salesCount = salesByProduct[product.id] || 0;
              const statusColors = {
                draft: 'bg-white text-black',
                pending_review: 'bg-yellow-100 text-yellow-700',
                approved: 'bg-brand-green-100 text-brand-green-700',
                rejected: 'bg-brand-red-100 text-brand-red-700',
                archived: 'bg-white text-black',
              };

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative aspect-video bg-white flex items-center justify-center">
                    {product.thumbnail_url ? (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <svg
                        className="w-16 h-16 text-white opacity-50"
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

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {product.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-2 rounded ${
                          statusColors[
                            product.status as keyof typeof statusColors
                          ] || statusColors.draft
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    <p className="text-sm text-black mb-3 line-clamp-2">
                      {product.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-brand-blue-600">
                        ${(product.price_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-black">
                        {salesCount} {salesCount === 1 ? 'sale' : 'sales'}
                      </span>
                    </div>

                    {product.rejection_reason && (
                      <div className="bg-brand-red-50 border border-brand-red-200 rounded p-2 mb-3">
                        <p className="text-xs text-brand-red-700">
                          <strong>Rejected:</strong> {product.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/creator/products/${product.id}/edit`}
                        className="flex-1 text-center border border-gray-300 text-black py-2 rounded hover:bg-white transition text-sm"
                      >
                        Edit
                      </Link>
                      {product.status === 'approved' && (
                        <Link
                          href={`/marketplace/product/${product.id}`}
                          className="flex-1 text-center bg-brand-blue-600 text-white py-2 rounded hover:bg-brand-blue-700 transition text-sm"
                        >
                          View Live
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
