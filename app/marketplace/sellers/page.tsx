import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Metadata } from 'next';
import { User, Star, Package, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sellers | Marketplace',
  description: 'Browse sellers and creators on the marketplace.',
};

export const dynamic = 'force-dynamic';

export default async function MarketplaceSellersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch sellers from database
  const { data: sellers, error } = await db
    .from('marketplace_sellers')
    .select(`
      id,
      store_name,
      description,
      rating,
      total_sales,
      products_count,
      is_verified,
      profile:profiles(full_name, avatar_url)
    `)
    .eq('is_active', true)
    .order('total_sales', { ascending: false });

  if (error) {
    console.error('Error fetching sellers:', error.message);
  }

  const sellerList = sellers || [];

  return (
    <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Sellers" }]} />
      </div>
<div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Sellers</h1>
          <p className="text-gray-600 mt-1">Discover creators and their products</p>
        </div>

        {sellerList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerList.map((seller: any) => (
              <div key={seller.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{seller.store_name || seller.profile?.full_name || 'Seller'}</h3>
                      {seller.is_verified && (
                        <span className="px-2 py-0.5 bg-brand-blue-100 text-brand-blue-700 text-xs rounded-full">Verified</span>
                      )}
                    </div>
                    {seller.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{seller.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{seller.description || 'Creator on the marketplace'}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {seller.products_count || 0} products
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {seller.total_sales || 0} sales
                  </span>
                </div>
                <Link
                  href={`/marketplace/sellers/${seller.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium"
                >
                  View Store
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No sellers yet</h2>
            <p className="text-gray-600 mb-6">Be the first to sell on our marketplace.</p>
            <Link 
              href="/marketplace/sell"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              Become a Seller
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
