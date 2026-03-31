
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {

  FileText, Download, Star, Tag, Search, Package,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Digital Products & Resources | Elevate for Humanity',
  description:
    'Study guides, resume templates, career toolkits, and professional resources for workforce development students and graduates.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/marketplace/products',
  },
};

export default async function MarketplaceProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('marketplace_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  const items = products || [];

  // Group by category
  const categories = Array.from(new Set(items.map(p => p.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[
        { label: 'Community', href: '/community' },
        { label: 'Marketplace', href: '/community/marketplace' },
        { label: 'Products' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Digital Products & Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Study guides, resume templates, career toolkits, and professional resources
            for workforce development students and graduates.
          </p>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <span className="px-4 py-2 bg-brand-blue-600 text-white rounded-full text-sm font-medium">All</span>
            {categories.map(cat => (
              <span key={cat} className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-700 hover:bg-white cursor-pointer">
                {cat}
              </span>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No products yet</h2>
            <p className="text-gray-500">No products listed yet. Contact us to request study guides, templates, or resources.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(product => {
              const images = product.images as string[] || [];
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition group">
                  {images[0] && (
                    <div className="relative h-48 bg-white overflow-hidden">
                      <Image
                        src={images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                       sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                  )}
                  <div className="p-6">
                    {product.category && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-brand-blue-500" />
                        <span className="text-sm text-brand-blue-600 font-medium">{product.category}</span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-blue-600 transition">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${
                        product.price === 0 ? 'text-brand-green-600' : 'text-gray-900'
                      }`}>
                        {product.price === 0 ? 'Free' : `$${product.price}`}
                      </span>
                      {product.condition && (
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {product.condition}
                        </span>
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
