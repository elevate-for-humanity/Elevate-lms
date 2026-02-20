import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Star, ShoppingCart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Marketplace | Elevate For Humanity',
  description: 'Browse digital products, courses, and resources from creators.',
};

export const dynamic = 'force-dynamic';

export default async function MarketplaceBrowsePage() {
  const supabase = await createClient();

  // Fetch marketplace items from database
  const { data: items, error } = await supabase
    .from('marketplace_items')
    .select(`
      id,
      title,
      description,
      price,
      category,
      rating,
      reviews_count,
      image_url,
      seller_id,
      seller:profiles(full_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching marketplace items:', error.message);
  }

  const itemList = items || [];
  const categories = ['All', ...new Set(itemList.map((i: any) => i.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Browse" }]} />
      </div>
{/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/technology/hero-programs-technology.jpg" alt="Marketplace" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Marketplace</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Digital products, courses, and resources from creators</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {itemList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {itemList.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                <div className="relative h-40">
                  <Image 
                    src={item.image_url || '/images/gallery/image4.jpg'} 
                    alt={item.title} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500">{item.category || 'General'}</span>
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">{item.seller?.full_name || 'Elevate for Humanity'}</span>
                  </div>
                  {item.rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{item.rating}</span>
                      <span className="text-sm text-gray-500">({item.reviews_count || 0})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-gray-900">${item.price || 0}</span>
                    <Link
                      href={`/marketplace/items/${item.id}`}
                      className="p-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="relative h-48">
              <Image src="/images/heroes/resource-1.jpg" alt="Browse marketplace" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Items Available</h2>
              <p className="text-gray-600 mb-6">Check back soon for digital products and resources.</p>
              <Link href="/store" className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
                Visit Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
