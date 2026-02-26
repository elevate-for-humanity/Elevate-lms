import Image from 'next/image';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Marketplace Products | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { requireAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import ProductApprovalActions from './ProductApprovalActions';


export default async function AdminProductsPage() {
  await requireAdmin();

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

  // Fetch all products with creator info
  const { data: products } = await db
    .from('marketplace_products')
    .select(
      `
      *,
      creator:marketplace_creators(display_name, payout_email)
    `
    )
    .order('created_at', { ascending: false });

  const pendingProducts =
    products?.filter(
      (p) => p.status === 'pending_review' || p.status === 'draft'
    ) || [];
  const approvedProducts =
    products?.filter((p) => p.status === 'approved') || [];
  const rejectedProducts =
    products?.filter((p) => p.status === 'rejected') || [];

  return (
    <div className="py-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Products" }]} />
      </div>
<div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
        <p className="text-black">
          Review and approve creator products before they go live
        </p>
      </div>

      {/* Pending Products */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Pending Review ({pendingProducts.length})
        </h2>

        {pendingProducts.length === 0 ? (
          <p className="text-black">No products pending review.</p>
        ) : (
          <div className="space-y-4">
            {pendingProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  <p className="text-sm text-black mb-2">
                    by {product.creator?.display_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-black mb-3">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-black">
                      Price:{' '}
                      <strong>${(product.price_cents / 100).toFixed(2)}</strong>
                    </span>
                    {product.category && (
                      <span className="text-black">
                        Category: <strong>{product.category}</strong>
                      </span>
                    )}
                    <span className="text-black">
                      Status:{' '}
                      <strong className="text-yellow-600">
                        {product.status}
                      </strong>
                    </span>
                  </div>
                  {product.file_url && (
                    <div className="mt-2">
                      <a
                        href={product.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 hover:underline text-sm"
                      >
                        View Product File →
                      </a>
                    </div>
                  )}
                </div>
                <ProductApprovalActions productId={product.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Products */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Approved Products ({approvedProducts.length})
        </h2>

        {approvedProducts.length === 0 ? (
          <p className="text-black">No approved products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold mb-1">{product.title}</h3>
                <p className="text-sm text-black mb-2">
                  by {product.creator?.display_name || 'Unknown'}
                </p>
                <p className="text-lg font-bold text-brand-blue-600">
                  ${(product.price_cents / 100).toFixed(2)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="text-sm text-brand-blue-600 hover:underline" aria-label="Action button">
                    Edit
                  </button>
                  <button className="text-sm text-brand-orange-600 hover:underline" aria-label="Action button">
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Products */}
      {rejectedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">
            Rejected Products ({rejectedProducts.length})
          </h2>
          <div className="space-y-4">
            {rejectedProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 bg-brand-red-50">
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-black">
                  by {product.creator?.display_name || 'Unknown'}
                </p>
                {product.rejection_reason && (
                  <p className="text-sm text-brand-red-700 mt-2">
                    Reason: {product.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
