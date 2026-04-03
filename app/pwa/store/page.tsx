import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

async function getStoreData() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, short_description, price, compare_price, category, image_url, is_active, is_featured, badge, type')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(50);

  const allProducts = products || [];
  const categories = [...new Set(allProducts.map((p: any) => p.category).filter(Boolean))];

  return { products: allProducts, categories };
}

export default async function StorePWAPage() {
  const { products, categories } = await getStoreData();

  const featured = products.filter((p: any) => p.is_featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image src="/images/pages/demo-page-5.jpg" alt="Elevate Store" fill className="object-cover" priority  sizes="100vw" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-white">Elevate Store</h1>
          <p className="text-white text-sm mt-1">{products.length} products · Training materials, toolkits, and licenses</p>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link href="/store" className="bg-brand-red-600 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex-shrink-0">
            All ({products.length})
          </Link>
          {categories.map((cat: string) => (
            <Link key={cat} href={`/store?category=${cat}`} className="bg-white border border-slate-200 text-slate-700 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex-shrink-0 hover:bg-white">
              {cat.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} ({products.filter((p: any) => p.category === cat).length})
            </Link>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Featured</h2>
          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((product: any) => (
              <Link key={product.id} href={`/store/${product.slug || product.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-28 bg-white overflow-hidden">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover"  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">🛒</div>
                  )}
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-brand-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{product.badge}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-slate-900 text-xs truncate">{product.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-brand-red-600 font-bold text-sm">${product.price}</span>
                    {product.compare_price && (
                      <span className="text-slate-400 text-xs line-through">${product.compare_price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">All Products</h2>
        <div className="space-y-2">
          {products.map((product: any) => (
            <Link key={product.id} href={`/store/${product.slug || product.id}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-brand-red-300">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{product.name}</div>
                <div className="text-xs text-slate-500">{product.category?.replace(/-/g, ' ')} · {product.type || 'product'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-brand-red-600 font-bold text-sm">${product.price}</div>
                {product.compare_price && <div className="text-slate-400 text-xs line-through">${product.compare_price}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
