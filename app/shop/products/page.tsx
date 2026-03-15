import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Search,
  Filter,
  ShoppingCart,
  Star,
  Package,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Products | Elevate Shop',
  description: 'Browse professional tools, supplies, and learning materials.',
};

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  image_url?: string;
}

export default async function ProductsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  // Fetch products from database
  const { data: productsData, error } = await db
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error.message);
  }

  const products: Product[] = (productsData || []).map((p: any) => ({
    id: p.id,
    name: p.name || 'Untitled Product',
    description: p.description || '',
    price: p.price || 0,
    original_price: p.original_price,
    category: p.category || 'General',
    rating: p.rating || 0,
    reviews_count: p.reviews_count || 0,
    in_stock: p.in_stock !== false,
    image_url: p.image_url,
  }));

  // Get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Products' }]} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Professional tools and learning materials</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 w-64"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-white">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <Link
                href="/shop/cart"
                className="inline-flex items-center gap-2 px-3 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-white flex items-center justify-center relative">
                  <Package className="w-16 h-16 text-gray-300" />
                  {!product.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1 bg-white text-gray-900 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {product.original_price && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-brand-red-500 text-white text-xs font-medium rounded">
                      Sale
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500">{product.category}</span>
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews_count})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      {product.original_price && (
                        <span className="text-sm text-slate-500 line-through">${product.original_price}</span>
                      )}
                    </div>
                    <button
                      disabled={!product.in_stock}
                      className="p-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No products available</h2>
            <p className="text-gray-600 mb-6">No products available yet. Contact us to request learning materials.</p>
            <Link href="/shop" className="text-brand-blue-600 hover:underline">
              Return to Shop
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
